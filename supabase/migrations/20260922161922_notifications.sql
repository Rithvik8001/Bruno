alter table public.profiles
  add column timezone text
    check (timezone is null or char_length(timezone) between 3 and 64),
  add column renewal_reminders boolean not null default true,
  add column trial_reminders boolean not null default true,
  add column renews_today boolean not null default true,
  add column monthly_digest boolean not null default true,
  add column reminder_lead_days smallint not null default 3
    check (reminder_lead_days in (1, 3, 7));

grant insert (id, currency, timezone) on public.profiles to authenticated;
grant update (
  timezone,
  renewal_reminders,
  trial_reminders,
  renews_today,
  monthly_digest,
  reminder_lead_days
) on public.profiles to authenticated;

create table public.notification_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete cascade,
  kind text not null check (
    kind in ('welcome', 'renewal', 'trial', 'renews_today', 'digest')
  ),
  due_on date not null,
  created_at timestamptz not null default now()
);

create unique index notification_sends_key
  on public.notification_sends (
    user_id,
    kind,
    coalesce(subscription_id, '00000000-0000-0000-0000-000000000000'::uuid),
    due_on
  );

create index notification_sends_created_at_idx
  on public.notification_sends (created_at);

alter table public.notification_sends enable row level security;
revoke all on public.notification_sends from anon, authenticated;

create function public.claim_notification(
  p_user_id uuid,
  p_subscription_id uuid,
  p_kind text,
  p_due_on date
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  insert into public.notification_sends (user_id, subscription_id, kind, due_on)
  values (p_user_id, p_subscription_id, p_kind, p_due_on)
  on conflict do nothing
  returning id into inserted_id;
  return inserted_id is not null;
end;
$$;

create function public.release_notification(
  p_user_id uuid,
  p_subscription_id uuid,
  p_kind text,
  p_due_on date
) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.notification_sends
  where user_id = p_user_id
    and kind = p_kind
    and coalesce(subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(p_subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and due_on = p_due_on;
$$;

revoke execute on function public.claim_notification(uuid, uuid, text, date)
  from public, anon, authenticated;
revoke execute on function public.release_notification(uuid, uuid, text, date)
  from public, anon, authenticated;

create index subscriptions_active_user_idx
  on public.subscriptions (user_id)
  where status = 'active';

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'bruno-notifications-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret from vault.decrypted_secrets where name = 'app_origin'
    ) || '/api/cron/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

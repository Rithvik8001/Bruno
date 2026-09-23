alter table public.profiles
  add column push_enabled boolean not null default true,
  add column email_enabled boolean not null default true,
  add column notification_frequency text not null default 'event'
    check (notification_frequency in ('event', 'daily', 'twice')),
  add column send_hour smallint not null default 9
    check (send_hour between 0 and 23),
  add column second_send_hour smallint not null default 18
    check (second_send_hour between 0 and 23),
  add constraint profiles_send_hours_order check (second_send_hour > send_hour);

grant update (
  push_enabled,
  email_enabled,
  notification_frequency,
  send_hour,
  second_send_hour
) on public.profiles to authenticated;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique
    check (token ~ '^Expo(nent)?PushToken\[[^\]]{8,200}\]$'),
  platform text not null default 'ios' check (platform in ('ios')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;

create table public.push_receipts (
  ticket_id text primary key,
  token text not null,
  created_at timestamptz not null default now()
);

create index push_receipts_created_at_idx on public.push_receipts (created_at);

alter table public.push_receipts enable row level security;
revoke all on public.push_receipts from anon, authenticated;

create function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[^\]]{8,200}\]$' then
    raise exception 'invalid token' using errcode = '22023';
  end if;

  insert into public.push_tokens (user_id, token)
  values (uid, p_token)
  on conflict (token) do update
    set user_id = excluded.user_id, last_seen_at = now();

  delete from public.push_tokens
  where user_id = uid
    and id not in (
      select id from public.push_tokens
      where user_id = uid
      order by last_seen_at desc
      limit 10
    );
end;
$$;

create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens
  where token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.register_push_token(text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

alter table public.notification_sends
  add column channel text not null default 'email'
    check (channel in ('email', 'push'));

alter table public.notification_sends
  drop constraint notification_sends_kind_check;
alter table public.notification_sends
  add constraint notification_sends_kind_check check (
    kind in (
      'welcome', 'renewal', 'trial', 'renews_today', 'digest', 'batch', 'batch_second'
    )
  );

drop index public.notification_sends_key;
create unique index notification_sends_key
  on public.notification_sends (
    user_id,
    channel,
    kind,
    coalesce(subscription_id, '00000000-0000-0000-0000-000000000000'::uuid),
    due_on
  );

drop function public.claim_notification(uuid, uuid, text, date);
drop function public.release_notification(uuid, uuid, text, date);

create function public.claim_notification(
  p_user_id uuid,
  p_subscription_id uuid,
  p_kind text,
  p_due_on date,
  p_channel text default 'email'
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  insert into public.notification_sends (user_id, subscription_id, kind, due_on, channel)
  values (p_user_id, p_subscription_id, p_kind, p_due_on, p_channel)
  on conflict do nothing
  returning id into inserted_id;
  return inserted_id is not null;
end;
$$;

create function public.release_notification(
  p_user_id uuid,
  p_subscription_id uuid,
  p_kind text,
  p_due_on date,
  p_channel text default 'email'
) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.notification_sends
  where user_id = p_user_id
    and channel = p_channel
    and kind = p_kind
    and coalesce(subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(p_subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and due_on = p_due_on;
$$;

revoke execute on function public.claim_notification(uuid, uuid, text, date, text)
  from public, anon, authenticated;
revoke execute on function public.release_notification(uuid, uuid, text, date, text)
  from public, anon, authenticated;

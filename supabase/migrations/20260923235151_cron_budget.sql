create function public.notification_context()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'email', u.email,
        'currency', p.currency,
        'timezone', p.timezone,
        'renewal_reminders', p.renewal_reminders,
        'trial_reminders', p.trial_reminders,
        'renews_today', p.renews_today,
        'monthly_digest', p.monthly_digest,
        'reminder_lead_days', p.reminder_lead_days,
        'push_enabled', p.push_enabled,
        'email_enabled', p.email_enabled,
        'notification_frequency', p.notification_frequency,
        'send_hour', p.send_hour,
        'second_send_hour', p.second_send_hour
      ) order by p.id)
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.renewal_reminders or p.trial_reminders or p.renews_today or p.monthly_digest
    ), '[]'::jsonb),
    'tokens', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', t.user_id, 'token', t.token))
      from public.push_tokens t
    ), '[]'::jsonb),
    'subscriptions', coalesce((
      select jsonb_agg(to_jsonb(s))
      from public.subscriptions s
      where s.status = 'active'
    ), '[]'::jsonb)
  );
$$;

create function public.claim_batches(p_batches jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  batch jsonb;
  results jsonb := '[]'::jsonb;
  claimed integer[];
begin
  for batch in select value from jsonb_array_elements(p_batches) loop
    claimed := public.claim_notifications(
      (batch->>'user_id')::uuid,
      batch->>'channel',
      case when batch ? 'gate' and jsonb_typeof(batch->'gate') = 'object' then batch->'gate' else null end,
      coalesce(batch->'claims', '[]'::jsonb)
    );
    results := results || jsonb_build_array(
      case when claimed is null then 'null'::jsonb else to_jsonb(claimed) end
    );
  end loop;
  return results;
end;
$$;

create function public.release_batches(p_batches jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  batch jsonb;
begin
  for batch in select value from jsonb_array_elements(p_batches) loop
    perform public.release_notifications(
      (batch->>'user_id')::uuid,
      batch->>'channel',
      coalesce(batch->'claims', '[]'::jsonb)
    );
  end loop;
end;
$$;

revoke execute on function public.notification_context() from public, anon, authenticated;
revoke execute on function public.claim_batches(jsonb) from public, anon, authenticated;
revoke execute on function public.release_batches(jsonb) from public, anon, authenticated;

select cron.unschedule('bruno-notifications-hourly');

select cron.schedule(
  'bruno-notifications',
  '*/5 * * * *',
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

select cron.schedule(
  'bruno-push-receipts',
  '30 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret from vault.decrypted_secrets where name = 'app_origin'
    ) || '/api/cron/notifications?task=receipts',
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

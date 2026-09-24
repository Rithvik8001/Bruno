create function public.claim_notifications(
  p_user_id uuid,
  p_channel text,
  p_gate jsonb,
  p_claims jsonb
) returns integer[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
  claimed integer[] := '{}';
  entry jsonb;
  i integer := 0;
begin
  if p_gate is not null then
    insert into public.notification_sends (user_id, subscription_id, kind, due_on, channel)
    values (
      p_user_id,
      nullif(p_gate->>'subscription_id', '')::uuid,
      p_gate->>'kind',
      (p_gate->>'due_on')::date,
      p_channel
    )
    on conflict do nothing
    returning id into inserted_id;
    if inserted_id is null then
      return null;
    end if;
  end if;

  for entry in select value from jsonb_array_elements(p_claims) loop
    inserted_id := null;
    insert into public.notification_sends (user_id, subscription_id, kind, due_on, channel)
    values (
      p_user_id,
      nullif(entry->>'subscription_id', '')::uuid,
      entry->>'kind',
      (entry->>'due_on')::date,
      p_channel
    )
    on conflict do nothing
    returning id into inserted_id;
    if inserted_id is not null then
      claimed := claimed || i;
    end if;
    i := i + 1;
  end loop;
  return claimed;
end;
$$;

create function public.release_notifications(
  p_user_id uuid,
  p_channel text,
  p_claims jsonb
) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.notification_sends s
  using jsonb_to_recordset(p_claims)
    as c(kind text, subscription_id uuid, due_on date)
  where s.user_id = p_user_id
    and s.channel = p_channel
    and s.kind = c.kind
    and coalesce(s.subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(c.subscription_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and s.due_on = c.due_on;
$$;

revoke execute on function public.claim_notifications(uuid, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke execute on function public.release_notifications(uuid, text, jsonb)
  from public, anon, authenticated;

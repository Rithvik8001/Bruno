create or replace function public.currency_digits(code text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when code in ('BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF') then 0
    when code in ('BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND') then 3
    else 2
  end
$$;

revoke all on function public.currency_digits(text) from public, anon, authenticated;

create or replace function public.change_currency(p_currency text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  current_code text;
  shift integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid currency' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  select currency into current_code from public.profiles where id = uid for update;
  if current_code is null then
    raise exception 'profile missing' using errcode = 'BR002';
  end if;
  if current_code = p_currency then
    return;
  end if;

  shift := public.currency_digits(p_currency) - public.currency_digits(current_code);

  update public.subscriptions
  set
    currency = p_currency,
    amount_minor = case
      when shift >= 0 then amount_minor * power(10, shift)::bigint
      else greatest(1, round(amount_minor::numeric / power(10, -shift)::numeric))::bigint
    end
  where user_id = uid;

  update public.profiles set currency = p_currency where id = uid;
end;
$$;

revoke all on function public.change_currency(text) from public, anon;
grant execute on function public.change_currency(text) to authenticated;

revoke update (currency) on public.profiles from authenticated;

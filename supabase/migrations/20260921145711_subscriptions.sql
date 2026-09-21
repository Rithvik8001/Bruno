create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  service_key text check (service_key is null or char_length(service_key) between 1 and 64),
  amount_minor bigint not null check (amount_minor between 0 and 99999999999),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  cycle_unit text not null check (cycle_unit in ('day', 'week', 'month', 'year')),
  cycle_count smallint not null default 1 check (cycle_count between 1 and 99),
  anchor_date date not null,
  trial_ends_on date,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  category text check (
    category is null or category in (
      'entertainment',
      'music',
      'productivity',
      'cloud_storage',
      'news_reading',
      'health_fitness',
      'gaming',
      'utilities_bills',
      'education',
      'other'
    )
  ),
  payment_method text check (
    payment_method is null
    or (char_length(payment_method) between 1 and 40 and payment_method !~ '[0-9]{7,}')
  ),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_trial_before_anchor
    check (trial_ends_on is null or trial_ends_on <= anchor_date)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create or replace function public.subscriptions_before_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  profile_currency text;
  existing integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select count(*) into existing
  from public.subscriptions
  where user_id = new.user_id;

  if existing >= 500 then
    raise exception 'subscription limit reached' using errcode = 'BR001';
  end if;

  select currency into profile_currency
  from public.profiles
  where id = new.user_id;

  if profile_currency is null then
    raise exception 'profile missing' using errcode = 'BR002';
  end if;

  new.currency = profile_currency;
  return new;
end;
$$;

create trigger subscriptions_before_insert
before insert on public.subscriptions
for each row execute function public.subscriptions_before_insert();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_select_own on public.subscriptions
for select to authenticated
using (user_id = (select auth.uid()));

create policy subscriptions_insert_own on public.subscriptions
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy subscriptions_update_own on public.subscriptions
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy subscriptions_delete_own on public.subscriptions
for delete to authenticated
using (user_id = (select auth.uid()));

revoke all on public.subscriptions from anon, authenticated;
grant select, delete on public.subscriptions to authenticated;
grant insert (
  name,
  service_key,
  amount_minor,
  currency,
  cycle_unit,
  cycle_count,
  anchor_date,
  trial_ends_on,
  status,
  category,
  payment_method,
  notes
) on public.subscriptions to authenticated;
grant update (
  name,
  service_key,
  amount_minor,
  cycle_unit,
  cycle_count,
  anchor_date,
  trial_ends_on,
  status,
  category,
  payment_method,
  notes
) on public.subscriptions to authenticated;

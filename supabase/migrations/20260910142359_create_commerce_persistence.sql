-- Private server-side persistence for the internal test offer only. This schema is
-- intentionally absent from the Data API configuration in supabase/config.toml.
create schema if not exists commerce;

revoke all on schema commerce from public, anon, authenticated, service_role;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'commerce_runtime') then
    create role commerce_runtime nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
end
$$;

grant usage on schema commerce to commerce_runtime;

-- Local Supabase migrations run as postgres. Membership lets the disposable CI
-- administrator exercise the restricted runtime role without changing that
-- role's privileges; production application logins must be granted separately.
grant commerce_runtime to postgres;

create table commerce.orders (
  id uuid primary key default gen_random_uuid(),
  creation_identity uuid not null unique,
  offer_id text not null check (offer_id = 'offer_test_freelancer_cashflow_v1'),
  product_id text not null check (product_id = 'prd_test_freelancer_cashflow_v1'),
  title text not null check (title = 'Freelancer Cashflow Planner — internal commerce test offer'),
  amount_minor integer not null check (amount_minor = 4900),
  currency text not null check (currency = 'THB'),
  quantity smallint not null check (quantity = 1),
  environment text not null check (environment = 'test'),
  offer_state text not null check (offer_state = 'test_only'),
  guest_capability_digest bytea,
  created_at timestamptz not null default now()
);

create table commerce.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references commerce.orders(id) on delete restrict,
  provider text not null check (provider = 'stripe'),
  environment text not null check (environment = 'test'),
  idempotency_key uuid not null,
  provider_session_reference text,
  attempt_state text not null check (attempt_state in ('created', 'authorized', 'failed')),
  created_at timestamptz not null default now(),
  unique (provider, environment, idempotency_key)
);

create unique index payment_attempts_provider_session_reference_unique
  on commerce.payment_attempts (provider, environment, provider_session_reference)
  where provider_session_reference is not null;

create table commerce.entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references commerce.orders(id) on delete restrict,
  product_id text not null check (product_id = 'prd_test_freelancer_cashflow_v1'),
  grant_state text not null check (grant_state = 'active'),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create function commerce.reject_order_snapshot_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'commerce order snapshots are immutable';
end;
$$;

create trigger orders_snapshot_immutable
before update or delete on commerce.orders
for each row execute function commerce.reject_order_snapshot_mutation();

alter table commerce.orders enable row level security;
alter table commerce.payment_attempts enable row level security;
alter table commerce.entitlements enable row level security;

create policy commerce_runtime_orders on commerce.orders
  for all to commerce_runtime using (true) with check (true);
create policy commerce_runtime_attempts on commerce.payment_attempts
  for all to commerce_runtime using (true) with check (true);
create policy commerce_runtime_entitlements on commerce.entitlements
  for all to commerce_runtime using (true) with check (true);

grant select, insert, update, delete on commerce.orders, commerce.payment_attempts, commerce.entitlements to commerce_runtime;

alter default privileges in schema commerce revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema commerce grant select, insert, update, delete on tables to commerce_runtime;

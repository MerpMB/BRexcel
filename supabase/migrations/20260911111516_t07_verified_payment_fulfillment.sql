-- T07: durable, verified Stripe sandbox payment fulfillment. This migration is
-- deliberately forward-only; it never changes the applied T05 schema file.
do $$
begin
  if exists (select 1 from commerce.payment_attempts where attempt_state = 'authorized') then
    raise exception 'T07 migration refused: legacy authorized payment attempts require lead disposition';
  end if;
  if exists (select 1 from commerce.entitlements) then
    raise exception 'T07 migration refused: legacy entitlements lack verified payment provenance';
  end if;
end
$$;

alter table commerce.orders
  add column version_id text,
  add column fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending', 'fulfilled', 'attention')),
  add column fulfilled_at timestamptz,
  add column recovery_email text;

update commerce.orders
set version_id = 'freelancer-cashflow-v1'
where offer_id = 'offer_test_freelancer_cashflow_v1'
  and product_id = 'prd_test_freelancer_cashflow_v1';

alter table commerce.orders
  alter column version_id set not null,
  add constraint orders_version_id_fixed check (version_id = 'freelancer-cashflow-v1');

alter table commerce.payment_attempts
  add column provider_payment_reference text,
  add column observed_amount_minor integer,
  add column observed_currency text,
  add column provider_payment_status text,
  add column verified_at timestamptz;

alter table commerce.payment_attempts
  drop constraint if exists payment_attempts_attempt_state_check,
  add constraint payment_attempts_attempt_state_check
    check (attempt_state in ('created', 'pending', 'failed', 'expired', 'paid')),
  add constraint payment_attempts_observed_currency_check
    check (observed_currency is null or observed_currency = 'THB'),
  add constraint payment_attempts_paid_evidence_check
    check (
      attempt_state <> 'paid'
      or (
        provider_payment_reference is not null
        and observed_amount_minor = 4900
        and observed_currency = 'THB'
        and provider_payment_status = 'paid'
        and verified_at is not null
      )
    );

create unique index payment_attempts_provider_payment_reference_unique
  on commerce.payment_attempts (provider, environment, provider_payment_reference)
  where provider_payment_reference is not null;
create index payment_attempts_order_id_index on commerce.payment_attempts (order_id);

create table commerce.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'stripe'),
  environment text not null check (environment = 'test'),
  provider_event_id text not null,
  event_type text not null check (event_type in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired'
  )),
  provider_object_reference text not null,
  provider_account_id text,
  envelope_livemode boolean not null,
  payment_attempt_id uuid references commerce.payment_attempts(id) on delete restrict,
  outcome text not null check (outcome in (
    'fulfilled', 'already_fulfilled', 'observed_unpaid', 'observed_failed',
    'observed_expired', 'attention'
  )),
  processed_at timestamptz not null default now(),
  anomaly_code text,
  unique (provider, environment, provider_event_id)
);

alter table commerce.entitlements
  add column version_id text,
  add column source_payment_attempt_id uuid references commerce.payment_attempts(id) on delete restrict;

alter table commerce.entitlements
  alter column version_id set not null,
  alter column source_payment_attempt_id set not null,
  add constraint entitlements_version_id_fixed check (version_id = 'freelancer-cashflow-v1');

alter table commerce.entitlements
  drop constraint if exists entitlements_order_id_product_id_key,
  add constraint entitlements_one_per_order unique (order_id);

create or replace function commerce.reject_order_snapshot_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'commerce orders cannot be deleted';
  end if;
  if old.creation_identity is distinct from new.creation_identity
    or old.offer_id is distinct from new.offer_id
    or old.product_id is distinct from new.product_id
    or old.title is distinct from new.title
    or old.amount_minor is distinct from new.amount_minor
    or old.currency is distinct from new.currency
    or old.quantity is distinct from new.quantity
    or old.environment is distinct from new.environment
    or old.offer_state is distinct from new.offer_state
    or old.guest_capability_digest is distinct from new.guest_capability_digest
    or old.version_id is distinct from new.version_id
    or old.created_at is distinct from new.created_at then
    raise exception 'commerce order snapshots are immutable';
  end if;
  if old.fulfilled_at is not null and new.fulfilled_at is distinct from old.fulfilled_at then
    raise exception 'commerce fulfillment timestamp is immutable once set';
  end if;
  if old.recovery_email is not null and new.recovery_email is distinct from old.recovery_email then
    raise exception 'commerce recovery destination is immutable once set';
  end if;
  if (old.fulfillment_status = 'fulfilled' and new.fulfillment_status = 'pending')
    or (old.fulfillment_status = 'attention' and new.fulfillment_status <> 'attention') then
    raise exception 'commerce fulfillment state cannot regress';
  end if;
  return new;
end;
$$;

create or replace function commerce.enforce_payment_attempt_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'commerce entitlements cannot be deleted';
  end if;
  if old.attempt_state = 'paid' and new.attempt_state <> 'paid' then
    raise exception 'verified paid evidence cannot regress';
  end if;
  if old.provider_payment_reference is not null
    and new.provider_payment_reference is distinct from old.provider_payment_reference then
    raise exception 'provider payment reference is immutable once set';
  end if;
  if new.attempt_state = 'paid' and (
    new.provider_payment_reference is null
    or new.observed_amount_minor <> 4900
    or new.observed_currency <> 'THB'
    or new.provider_payment_status <> 'paid'
    or new.verified_at is null
  ) then
    raise exception 'verified paid evidence is incomplete';
  end if;
  return new;
end;
$$;

create or replace function commerce.enforce_verified_entitlement_source()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  attempt commerce.payment_attempts%rowtype;
  purchase commerce.orders%rowtype;
begin
  if tg_op = 'UPDATE' and (
    old.order_id is distinct from new.order_id
    or old.source_payment_attempt_id is distinct from new.source_payment_attempt_id
    or old.product_id is distinct from new.product_id
    or old.version_id is distinct from new.version_id
  ) then
    raise exception 'entitlement provenance is immutable';
  end if;
  select * into strict attempt from commerce.payment_attempts where id = new.source_payment_attempt_id;
  select * into strict purchase from commerce.orders where id = new.order_id;
  if attempt.order_id <> new.order_id or attempt.attempt_state <> 'paid' or attempt.verified_at is null then
    raise exception 'entitlement requires a verified paid attempt for its order';
  end if;
  if new.product_id <> purchase.product_id or new.version_id <> purchase.version_id then
    raise exception 'entitlement must match the immutable order snapshot';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_snapshot_immutable on commerce.orders;
create trigger orders_snapshot_immutable
before update or delete on commerce.orders
for each row execute function commerce.reject_order_snapshot_mutation();

create trigger payment_attempts_verified_evidence
before update on commerce.payment_attempts
for each row execute function commerce.enforce_payment_attempt_evidence();

create trigger entitlements_verified_source
before insert or update or delete on commerce.entitlements
for each row execute function commerce.enforce_verified_entitlement_source();

revoke all on table commerce.provider_events from public, anon, authenticated, service_role;
alter table commerce.provider_events enable row level security;
create policy commerce_runtime_provider_events_select on commerce.provider_events
  for select to commerce_runtime using (true);
create policy commerce_runtime_provider_events_insert on commerce.provider_events
  for insert to commerce_runtime with check (true);
grant select, insert on commerce.provider_events to commerce_runtime;

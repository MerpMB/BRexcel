-- T07 forward hardening: a paid attempt must have complete, conclusively valid
-- provider evidence. Do not repair historic evidence here: fail closed instead.
do $$
begin
  if exists (
    select 1
    from commerce.payment_attempts
    where attempt_state = 'paid'
      and (
        provider_payment_reference is null
        or observed_amount_minor is distinct from 4900
        or observed_currency is distinct from 'THB'
        or provider_payment_status is distinct from 'paid'
        or verified_at is null
      )
  ) then
    raise exception 'T07 hardening refused: paid payment attempts have incomplete verified evidence';
  end if;
end
$$;

alter table commerce.payment_attempts
  drop constraint if exists payment_attempts_paid_evidence_check,
  add constraint payment_attempts_paid_evidence_check
    check (
      attempt_state <> 'paid'
      or (
        provider_payment_reference is not null
        and observed_amount_minor is not distinct from 4900
        and observed_currency is not distinct from 'THB'
        and provider_payment_status is not distinct from 'paid'
        and verified_at is not null
      )
    );

create or replace function commerce.enforce_payment_attempt_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.attempt_state = 'paid' and new.attempt_state <> 'paid' then
    raise exception 'verified paid evidence cannot regress';
  end if;
  if old.provider_payment_reference is not null
    and new.provider_payment_reference is distinct from old.provider_payment_reference then
    raise exception 'provider payment reference is immutable once set';
  end if;
  if new.attempt_state = 'paid' and (
    new.provider_payment_reference is null
    or new.observed_amount_minor is distinct from 4900
    or new.observed_currency is distinct from 'THB'
    or new.provider_payment_status is distinct from 'paid'
    or new.verified_at is null
  ) then
    raise exception 'verified paid evidence is incomplete';
  end if;
  return new;
end;
$$;

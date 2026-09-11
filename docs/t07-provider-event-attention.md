# T07 provider-event attention records

Run this read-only query through an authorized PostgreSQL session when an operator needs to review a permanent Stripe fulfillment mismatch. Do not update or delete these records during investigation.

```sql
select
  processed_at,
  provider_event_id,
  event_type,
  provider_object_reference as session_reference,
  outcome,
  anomaly_code,
  payment_attempt_id
from commerce.provider_events
where provider = 'stripe'
  and environment = 'test'
  and outcome = 'attention'
order by processed_at desc;
```

The identifiers are operational correlation values only. The ledger intentionally contains no raw webhook payload, Stripe signature, secret, Checkout URL, card data, or recovery email.

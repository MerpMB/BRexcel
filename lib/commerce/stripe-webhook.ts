import Stripe from "stripe";
import { createStripeTestClient } from "./stripe-client";
import { type VerifiedStripeEvidence, supportedStripeEventTypes } from "./fulfillment-core";

export class WebhookEnvelopeError extends Error {}
export class RetryableProviderError extends Error {}
export class PermanentProviderMismatch extends Error {
  constructor(readonly code: "account_mismatch") { super(code); }
}

function requiredWebhookSecret(secret = process.env.STRIPE_TEST_WEBHOOK_SECRET) {
  if (!secret) throw new RetryableProviderError("Webhook configuration is unavailable");
  return secret;
}

function requiredAccountId(accountId = process.env.STRIPE_TEST_ACCOUNT_ID) {
  if (!accountId || !/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new RetryableProviderError("Stripe account configuration is unavailable");
  return accountId;
}

export async function verifyStripeWebhookEnvelope(rawBody: string, signature: string | null, client = createStripeTestClient(), secret = process.env.STRIPE_TEST_WEBHOOK_SECRET) {
  if (!signature) throw new WebhookEnvelopeError("Invalid webhook envelope");
  try {
    return await client.webhooks.constructEventAsync(rawBody, signature, requiredWebhookSecret(secret), 300, Stripe.createSubtleCryptoProvider());
  } catch {
    throw new WebhookEnvelopeError("Invalid webhook envelope");
  }
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function bounded<T>(operation: Promise<T>, timeoutMs = 8_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new RetryableProviderError("Stripe provider request timed out")), timeoutMs); }),
    ]);
  } catch (error) {
    if (error instanceof RetryableProviderError) throw error;
    throw new RetryableProviderError("Stripe provider request failed");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function retrieveVerifiedStripeEvidence(event: Stripe.Event, client = createStripeTestClient(), expectedAccountId = process.env.STRIPE_TEST_ACCOUNT_ID): Promise<VerifiedStripeEvidence | null> {
  if (!supportedStripeEventTypes.has(event.type)) return null;
  if (event.account) throw new PermanentProviderMismatch("account_mismatch");
  if (event.livemode) throw new PermanentProviderMismatch("account_mismatch");
  const account = await bounded(client.accounts.retrieve(null));
  if (account.id !== requiredAccountId(expectedAccountId)) throw new PermanentProviderMismatch("account_mismatch");
  const eventObject = event.data.object;
  if (eventObject.object !== "checkout.session") throw new WebhookEnvelopeError("Invalid webhook envelope");
  const eventSessionId = eventObject.id;
  const session = await bounded(client.checkout.sessions.retrieve(eventSessionId));
  const lineItems = await bounded(client.checkout.sessions.listLineItems(eventSessionId, { limit: 100 }));
  return {
    eventId: event.id,
    eventType: event.type,
    eventSessionId,
    eventLivemode: event.livemode,
    accountId: account.id,
    session: {
      id: session.id,
      livemode: session.livemode,
      mode: session.mode,
      paymentStatus: session.payment_status,
      paymentIntentId: paymentIntentId(session.payment_intent),
      amountTotal: session.amount_total,
      currency: session.currency,
      metadataOrderId: session.metadata?.order_id ?? null,
      metadataAttemptId: session.metadata?.payment_attempt_id ?? null,
      recoveryEmail: session.customer_details?.email ?? session.customer_email ?? null,
      shippingAmount: session.shipping_cost?.amount_total ?? 0,
    },
    lineItems: lineItems.data.map((item) => ({
      quantity: item.quantity,
      unitAmount: item.price?.unit_amount ?? null,
      amountTotal: item.amount_total,
      currency: item.currency,
      amountDiscount: item.amount_discount,
      amountTax: item.amount_tax,
    })),
    lineItemsComplete: !lineItems.has_more,
  };
}

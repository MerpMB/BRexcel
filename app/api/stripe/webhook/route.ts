import { NextRequest, NextResponse } from "next/server";
import { supportedStripeEventTypes } from "@/lib/commerce/fulfillment-core";
import { findPaymentAttemptForStripeSession, hasTerminalStripeProviderEvent, processVerifiedStripeEvent, recordStripeWebhookAttention } from "@/lib/commerce/persist";
import { PermanentProviderMismatch, RetryableProviderError, WebhookEnvelopeError, retrieveVerifiedStripeEvidence, verifyStripeWebhookEnvelope } from "@/lib/commerce/stripe-webhook";

const responseHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

function response(status: number, body: string) {
  return new NextResponse(body, { status, headers: responseHeaders });
}

function eventSessionId(event: { data: { object: unknown } }) {
  const object = event.data.object as { object?: unknown; id?: unknown };
  return object.object === "checkout.session" && typeof object.id === "string" ? object.id : null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let event;
  try {
    event = await verifyStripeWebhookEnvelope(rawBody, request.headers.get("stripe-signature"));
  } catch (error) {
    return response(error instanceof WebhookEnvelopeError ? 400 : 503, error instanceof WebhookEnvelopeError ? "Invalid webhook request" : "Webhook unavailable");
  }
  if (!supportedStripeEventTypes.has(event.type)) return response(200, "Ignored");
  const sessionId = eventSessionId(event);
  if (!sessionId) return response(400, "Invalid webhook request");
  try {
    if (await hasTerminalStripeProviderEvent(event.id)) return response(200, "Processed");
    let evidence;
    try {
      evidence = await retrieveVerifiedStripeEvidence(event);
    } catch (error) {
      if (error instanceof PermanentProviderMismatch) {
        await recordStripeWebhookAttention({ id: event.id, type: event.type, sessionId, livemode: event.livemode, accountId: event.account ?? null }, error.code);
        return response(200, "Processed");
      }
      throw error;
    }
    if (!evidence) return response(200, "Ignored");
    const lookup = await findPaymentAttemptForStripeSession(evidence.session.id, evidence.session.metadataAttemptId);
    if (lookup.kind === "binding-race") return response(503, "Webhook unavailable");
    await processVerifiedStripeEvent(evidence, lookup.kind === "unknown" ? null : lookup.attemptId);
    return response(200, "Processed");
  } catch (error) {
    if (error instanceof RetryableProviderError) return response(503, "Webhook unavailable");
    return response(503, "Webhook unavailable");
  }
}

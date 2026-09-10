import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import postgres from "postgres";

let client: postgres.Sql | undefined;

export function getCommerceDatabase() {
  if (client) return client;
  const connectionString = getCloudflareConnectionString() ?? process.env.COMMERCE_DATABASE_URL;
  if (!connectionString) throw new Error("HYPERDRIVE or COMMERCE_DATABASE_URL is required for commerce persistence");
  client = postgres(connectionString, { max: 4, prepare: true });
  return client;
}

function getCloudflareConnectionString() {
  try {
    const binding = (getCloudflareContext().env as Record<string, unknown>).HYPERDRIVE;
    return isHyperdriveBinding(binding) ? binding.connectionString : undefined;
  } catch {
    return undefined;
  }
}

function isHyperdriveBinding(value: unknown): value is { connectionString: string } {
  return typeof value === "object" && value !== null && "connectionString" in value && typeof value.connectionString === "string";
}

export async function closeCommerceDatabase() {
  if (client) await client.end({ timeout: 5 });
  client = undefined;
}

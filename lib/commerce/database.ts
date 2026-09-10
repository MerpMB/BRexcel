import "server-only";

import postgres from "postgres";

let client: postgres.Sql | undefined;

export function getCommerceDatabase() {
  if (client) return client;
  const connectionString = process.env.COMMERCE_DATABASE_URL;
  if (!connectionString) throw new Error("COMMERCE_DATABASE_URL is required for commerce persistence");
  client = postgres(connectionString, { max: 4, prepare: true });
  return client;
}

export async function closeCommerceDatabase() {
  if (client) await client.end({ timeout: 5 });
  client = undefined;
}

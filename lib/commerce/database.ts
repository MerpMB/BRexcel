import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import postgres from "postgres";
import { resolveCommerceDatabaseRuntime, withRequestOwnedCommerceDatabase } from "./database-runtime";

type CommerceDatabaseOperation<Result> = (database: postgres.Sql) => Promise<Result>;

let nodeClient: postgres.Sql | undefined;

/**
 * Runs one commerce operation with the database ownership appropriate to its runtime.
 * Worker clients are intentionally request-owned; Node/local clients retain the existing singleton.
 */
export function withCommerceDatabase<Result>(operation: CommerceDatabaseOperation<Result>) {
  const runtime = resolveCommerceDatabaseRuntime(
    process.env.COMMERCE_PLATFORM,
    process.env.COMMERCE_DATABASE_URL,
    () => getCloudflareContext(),
  );
  return runtime.kind === "worker"
    ? withRequestOwnedCommerceDatabase(runtime.connectionString, operation, createWorkerCommerceDatabase)
    : operation(getNodeCommerceDatabase(runtime.connectionString));
}

function getNodeCommerceDatabase(connectionString: string) {
  if (nodeClient) return nodeClient;
  nodeClient = postgres(connectionString, { max: 4, prepare: true });
  return nodeClient;
}

function createWorkerCommerceDatabase(connectionString: string) {
  return postgres(connectionString, { max: 1, prepare: true });
}

export async function closeCommerceDatabase() {
  if (nodeClient) await nodeClient.end({ timeout: 5 });
  nodeClient = undefined;
}

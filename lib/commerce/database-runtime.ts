import type postgres from "postgres";

export type CommerceDatabaseRuntime =
  | { kind: "worker"; connectionString: string }
  | { kind: "node"; connectionString: string };

export type WorkerRequestContext = { env: Record<string, unknown> };
type CommerceDatabaseOperation<Result> = (database: postgres.Sql) => Promise<Result>;
type CommerceDatabaseFactory = (connectionString: string) => postgres.Sql;

export function resolveCommerceDatabaseRuntime(
  workerContext: WorkerRequestContext | undefined,
  nodeConnectionString: string | undefined,
): CommerceDatabaseRuntime {
  if (workerContext) {
    const binding = workerContext.env.COMMERCE_DB;
    if (!isHyperdriveBinding(binding)) {
      throw new Error("COMMERCE_DB Hyperdrive binding is required for Worker commerce persistence");
    }

    return { kind: "worker", connectionString: binding.connectionString };
  }

  if (!nodeConnectionString) throw new Error("COMMERCE_DATABASE_URL is required for Node commerce persistence");
  return { kind: "node", connectionString: nodeConnectionString };
}

/**
 * Owns a Worker database client for precisely one request operation. The awaited
 * finally block drains the client before the handler can finish. Cleanup failures
 * never mask an error raised by the originating operation.
 */
export async function withRequestOwnedCommerceDatabase<Result>(
  connectionString: string,
  operation: CommerceDatabaseOperation<Result>,
  createClient: CommerceDatabaseFactory,
) {
  const requestClient = createClient(connectionString);
  let operationFailed = false;

  try {
    return await operation(requestClient);
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    try {
      await requestClient.end({ timeout: 5 });
    } catch (cleanupError) {
      if (!operationFailed) throw cleanupError;
    }
  }
}

function isHyperdriveBinding(value: unknown): value is { connectionString: string } {
  return typeof value === "object" && value !== null && "connectionString" in value && typeof value.connectionString === "string";
}

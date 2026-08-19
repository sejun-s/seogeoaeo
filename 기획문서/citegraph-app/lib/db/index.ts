import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";

export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

export function getDb() {
  let binding: D1Database | undefined;
  try {
    binding = env.DB;
  } catch {
    // fallback outside worker context
  }
  if (!binding) {
    binding = (globalThis as Record<string, unknown>).DB as D1Database || (process.env as Record<string, unknown>).DB as D1Database;
  }
  if (!binding) {
    throw new Error("DB binding 'DB' is undefined. Make sure Cloudflare D1 local simulation is running.");
  }
  return createDb(binding);
}

export type CiteGraphDb = ReturnType<typeof createDb>;

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as correspondenceSchema from "@shared/correspondence-schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const correspondencePool = new Pool({ connectionString: process.env.DATABASE_URL });
export const correspondenceDb = drizzle({ client: correspondencePool, schema: correspondenceSchema });
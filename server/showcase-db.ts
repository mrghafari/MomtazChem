import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as showcaseSchema from "@shared/showcase-schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const showcasePool = new Pool({ connectionString: process.env.DATABASE_URL });
export const showcaseDb = drizzle({ client: showcasePool, schema: showcaseSchema });
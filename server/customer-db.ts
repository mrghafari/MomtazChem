import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as customerSchema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const customerPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

export const customerDb = drizzle({ client: customerPool, schema: customerSchema });
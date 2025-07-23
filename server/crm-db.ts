import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as crmSchema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const crmPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Handle pool errors to prevent unhandled rejections
crmPool.on('error', (err) => {
  console.error('CRM database pool error:', err);
});

export const crmDb = drizzle({ client: crmPool, schema: crmSchema });
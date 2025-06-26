import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as customerSchema from "@shared/customer-schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const customerPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Handle pool errors to prevent unhandled rejections
customerPool.on('error', (err) => {
  console.error('Customer database pool error:', err);
});

export const customerDb = drizzle({ client: customerPool, schema: customerSchema });
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as emailSchema from "@shared/email-schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const emailPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Handle pool errors to prevent unhandled rejections
emailPool.on('error', (err) => {
  console.error('Email database pool error:', err);
});

export const emailDb = drizzle({ client: emailPool, schema: emailSchema });
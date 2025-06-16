import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// Import all schemas
import * as mainSchema from "@shared/schema";
import * as showcaseSchema from "@shared/showcase-schema";
import * as shopSchema from "@shared/shop-schema";
import * as customerSchema from "@shared/customer-schema";
import * as emailSchema from "@shared/email-schema";

// Configure WebSocket constructor once
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a single shared connection pool
export const sharedPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Limit maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Combine all schemas
const combinedSchema = {
  ...mainSchema,
  ...showcaseSchema,
  ...shopSchema,
  ...customerSchema,
  ...emailSchema,
};

// Create database instances with shared pool but different schema contexts
export const db = drizzle({ client: sharedPool, schema: mainSchema });
export const showcaseDb = drizzle({ client: sharedPool, schema: showcaseSchema });
export const shopDb = drizzle({ client: sharedPool, schema: shopSchema });
export const customerDb = drizzle({ client: sharedPool, schema: customerSchema });
export const emailDb = drizzle({ client: sharedPool, schema: emailSchema });
export const crmDb = drizzle({ client: sharedPool, schema: customerSchema }); // CRM uses customer schema

// Export pools for backward compatibility
export const pool = sharedPool;
export const showcasePool = sharedPool;
export const shopPool = sharedPool;
export const customerPool = sharedPool;
export const emailPool = sharedPool;
export const crmPool = sharedPool;
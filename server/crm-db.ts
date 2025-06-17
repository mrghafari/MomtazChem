import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as crmSchema from "../shared/customer-schema";

neonConfig.webSocketConstructor = ws;

export const crmPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const crmDb = drizzle({ client: crmPool, schema: crmSchema });
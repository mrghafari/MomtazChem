import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as crmSchema from "../shared/customer-schema";

export const crmPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const crmDb = drizzle({ client: crmPool, schema: crmSchema });
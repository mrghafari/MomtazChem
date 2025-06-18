import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as seoSchema from "../shared/schema";

export const seoPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const seoDb = drizzle({ client: seoPool, schema: seoSchema });
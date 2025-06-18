import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as seoSchema from "../shared/schema";

export const seoPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const seoDb = drizzle({ client: seoPool, schema: seoSchema });
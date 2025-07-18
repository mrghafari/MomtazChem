import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, desc, sql } from "drizzle-orm";
import { simpleSmsTemplates, type InsertSimpleSmsTemplate, type SimpleSmsTemplate } from "../shared/schema";

export const simpleSmsPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const simpleSmsDb = drizzle({ client: simpleSmsPool, schema: { simpleSmsTemplates } });

export interface ISimpleSmsStorage {
  getAllTemplates(): Promise<SimpleSmsTemplate[]>;
  getTemplateById(id: number): Promise<SimpleSmsTemplate | undefined>;
  createTemplate(template: InsertSimpleSmsTemplate): Promise<SimpleSmsTemplate>;
  updateTemplate(id: number, updates: Partial<InsertSimpleSmsTemplate>): Promise<SimpleSmsTemplate>;
  deleteTemplate(id: number): Promise<void>;
  incrementTemplateUsage(id: number): Promise<void>;
}

export class SimpleSmsStorage implements ISimpleSmsStorage {
  async getAllTemplates(): Promise<SimpleSmsTemplate[]> {
    return await simpleSmsDb
      .select()
      .from(simpleSmsTemplates)
      .where(eq(simpleSmsTemplates.isActive, true))
      .orderBy(desc(simpleSmsTemplates.createdAt));
  }

  async getTemplateById(id: number): Promise<SimpleSmsTemplate | undefined> {
    const results = await simpleSmsDb
      .select()
      .from(simpleSmsTemplates)
      .where(eq(simpleSmsTemplates.id, id))
      .limit(1);
    
    return results[0];
  }

  async createTemplate(template: InsertSimpleSmsTemplate): Promise<SimpleSmsTemplate> {
    const results = await simpleSmsDb
      .insert(simpleSmsTemplates)
      .values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return results[0];
  }

  async updateTemplate(id: number, updates: Partial<InsertSimpleSmsTemplate>): Promise<SimpleSmsTemplate> {
    const results = await simpleSmsDb
      .update(simpleSmsTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(simpleSmsTemplates.id, id))
      .returning();
    
    if (results.length === 0) {
      throw new Error('Template not found');
    }
    
    return results[0];
  }

  async deleteTemplate(id: number): Promise<void> {
    await simpleSmsDb
      .update(simpleSmsTemplates)
      .set({ 
        isActive: false,
        updatedAt: new Date() 
      })
      .where(eq(simpleSmsTemplates.id, id));
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await simpleSmsDb
      .update(simpleSmsTemplates)
      .set({ 
        usageCount: sql`${simpleSmsTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(simpleSmsTemplates.id, id));
  }
}

export const simpleSmsStorage = new SimpleSmsStorage();
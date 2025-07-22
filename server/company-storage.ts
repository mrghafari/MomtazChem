import { db } from "./db";
import { companyInformation, type CompanyInformation, type InsertCompanyInformation } from "@shared/schema";
import { eq } from "drizzle-orm";

export class CompanyStorage {
  // Get company information (always returns the first/default record)
  async getCompanyInfo(): Promise<CompanyInformation | null> {
    try {
      const result = await db
        .select()
        .from(companyInformation)
        .where(eq(companyInformation.isActive, true))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Error getting company info:", error);
      return null;
    }
  }

  // Create company information (only if none exists)
  async createCompanyInfo(data: InsertCompanyInformation): Promise<CompanyInformation> {
    try {
      // Check if company info already exists
      const existing = await this.getCompanyInfo();
      if (existing) {
        throw new Error("Company information already exists. Use update instead.");
      }

      const result = await db
        .insert(companyInformation)
        .values({
          ...data,
          updatedAt: new Date(),
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error creating company info:", error);
      throw error;
    }
  }

  // Update company information
  async updateCompanyInfo(data: Partial<InsertCompanyInformation>): Promise<CompanyInformation> {
    try {
      // Get existing company info
      const existing = await this.getCompanyInfo();
      
      if (!existing) {
        // Create new record if none exists
        return await this.createCompanyInfo(data as InsertCompanyInformation);
      }

      const result = await db
        .update(companyInformation)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(companyInformation.id, existing.id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating company info:", error);
      throw error;
    }
  }

  // Upsert company information (create or update)
  async upsertCompanyInfo(data: InsertCompanyInformation): Promise<CompanyInformation> {
    try {
      const existing = await this.getCompanyInfo();
      
      if (existing) {
        return await this.updateCompanyInfo(data);
      } else {
        return await this.createCompanyInfo(data);
      }
    } catch (error) {
      console.error("Error upserting company info:", error);
      throw error;
    }
  }
}

export const companyStorage = new CompanyStorage();
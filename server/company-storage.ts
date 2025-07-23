import { db } from './db';
import { 
  companyInformation, 
  correspondence, 
  companyDocuments, 
  businessCards, 
  companyImages,
  type CompanyInformation,
  type InsertCompanyInformation,
  type Correspondence,
  type InsertCorrespondence,
  type CompanyDocument,
  type InsertCompanyDocument,
  type BusinessCard,
  type InsertBusinessCard,
  type CompanyImage,
  type InsertCompanyImage
} from '@shared/schema';
import { eq, desc, and, or, like, isNull } from 'drizzle-orm';

export class CompanyStorage {
  // Company Information methods
  async getCompanyInformation(): Promise<CompanyInformation | null> {
    try {
      const [company] = await db.select().from(companyInformation).where(eq(companyInformation.isActive, true)).limit(1);
      return company || null;
    } catch (error) {
      console.error('Error fetching company information:', error);
      return null;
    }
  }

  async updateCompanyInformation(data: Partial<InsertCompanyInformation>): Promise<CompanyInformation | null> {
    try {
      const existing = await this.getCompanyInformation();
      
      if (existing) {
        const [updated] = await db
          .update(companyInformation)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(companyInformation.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(companyInformation)
          .values(data as InsertCompanyInformation)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error updating company information:', error);
      throw error;
    }
  }

  // Correspondence methods
  async getCorrespondence(type?: 'incoming' | 'outgoing'): Promise<Correspondence[]> {
    try {
      const query = db.select().from(correspondence).where(eq(correspondence.isActive, true));
      
      if (type) {
        query.where(and(eq(correspondence.isActive, true), eq(correspondence.type, type)));
      }
      
      return await query.orderBy(desc(correspondence.createdAt));
    } catch (error) {
      console.error('Error fetching correspondence:', error);
      return [];
    }
  }

  async createCorrespondence(data: InsertCorrespondence): Promise<Correspondence> {
    try {
      const [created] = await db
        .insert(correspondence)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating correspondence:', error);
      throw error;
    }
  }

  async updateCorrespondence(id: number, data: Partial<InsertCorrespondence>): Promise<Correspondence | null> {
    try {
      const [updated] = await db
        .update(correspondence)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(correspondence.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating correspondence:', error);
      throw error;
    }
  }

  async deleteCorrespondence(id: number): Promise<boolean> {
    try {
      await db
        .update(correspondence)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(correspondence.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting correspondence:', error);
      return false;
    }
  }

  // Company Documents methods
  async getCompanyDocuments(): Promise<CompanyDocument[]> {
    try {
      return await db
        .select()
        .from(companyDocuments)
        .where(eq(companyDocuments.isActive, true))
        .orderBy(desc(companyDocuments.createdAt));
    } catch (error) {
      console.error('Error fetching company documents:', error);
      return [];
    }
  }

  async createCompanyDocument(data: InsertCompanyDocument): Promise<CompanyDocument> {
    try {
      const [created] = await db
        .insert(companyDocuments)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating company document:', error);
      throw error;
    }
  }

  async updateCompanyDocument(id: number, data: Partial<InsertCompanyDocument>): Promise<CompanyDocument | null> {
    try {
      const [updated] = await db
        .update(companyDocuments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companyDocuments.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating company document:', error);
      throw error;
    }
  }

  async deleteCompanyDocument(id: number): Promise<boolean> {
    try {
      await db
        .update(companyDocuments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(companyDocuments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting company document:', error);
      return false;
    }
  }

  // Business Cards methods
  async getBusinessCards(): Promise<BusinessCard[]> {
    try {
      return await db
        .select()
        .from(businessCards)
        .where(eq(businessCards.isActive, true))
        .orderBy(desc(businessCards.createdAt));
    } catch (error) {
      console.error('Error fetching business cards:', error);
      return [];
    }
  }

  async createBusinessCard(data: InsertBusinessCard): Promise<BusinessCard> {
    try {
      const [created] = await db
        .insert(businessCards)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating business card:', error);
      throw error;
    }
  }

  async updateBusinessCard(id: number, data: Partial<InsertBusinessCard>): Promise<BusinessCard | null> {
    try {
      const [updated] = await db
        .update(businessCards)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(businessCards.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating business card:', error);
      throw error;
    }
  }

  async approveBusinessCard(id: number, approvedBy: number): Promise<BusinessCard | null> {
    try {
      const [updated] = await db
        .update(businessCards)
        .set({ 
          cardStatus: 'approved', 
          approvedBy, 
          approvedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(businessCards.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error approving business card:', error);
      throw error;
    }
  }

  async deleteBusinessCard(id: number): Promise<boolean> {
    try {
      await db
        .update(businessCards)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(businessCards.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting business card:', error);
      return false;
    }
  }

  // Company Images methods
  async getCompanyImages(): Promise<CompanyImage[]> {
    try {
      return await db
        .select()
        .from(companyImages)
        .where(eq(companyImages.isActive, true))
        .orderBy(desc(companyImages.createdAt));
    } catch (error) {
      console.error('Error fetching company images:', error);
      return [];
    }
  }

  async createCompanyImage(data: InsertCompanyImage): Promise<CompanyImage> {
    try {
      const [created] = await db
        .insert(companyImages)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating company image:', error);
      throw error;
    }
  }

  async updateCompanyImage(id: number, data: Partial<InsertCompanyImage>): Promise<CompanyImage | null> {
    try {
      const [updated] = await db
        .update(companyImages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companyImages.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating company image:', error);
      throw error;
    }
  }

  async deleteCompanyImage(id: number): Promise<boolean> {
    try {
      await db
        .update(companyImages)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(companyImages.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting company image:', error);
      return false;
    }
  }
}

export const companyStorage = new CompanyStorage();
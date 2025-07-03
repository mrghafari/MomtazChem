import { 
  showcaseProducts, 
  contacts, 
  companyInfo, 
  news, 
  certifications,
  type ShowcaseProduct, 
  type InsertShowcaseProduct,
  type Contact,
  type InsertContact,
  type CompanyInfo,
  type InsertCompanyInfo,
  type News,
  type InsertNews,
  type Certification,
  type InsertCertification
} from "@shared/showcase-schema";
import { showcaseDb } from "./showcase-db";
import { eq, desc } from "drizzle-orm";

export interface IShowcaseStorage {
  // Showcase products for website display
  getShowcaseProducts(): Promise<ShowcaseProduct[]>;
  getAllShowcaseProducts(): Promise<ShowcaseProduct[]>; // Get all products including inactive ones
  getShowcaseProductsByCategory(category: string): Promise<ShowcaseProduct[]>;
  getShowcaseProductById(id: number): Promise<ShowcaseProduct | undefined>;
  createShowcaseProduct(product: InsertShowcaseProduct): Promise<ShowcaseProduct>;
  updateShowcaseProduct(id: number, product: Partial<InsertShowcaseProduct>): Promise<ShowcaseProduct>;
  deleteShowcaseProduct(id: number): Promise<void>;
  
  // Contact management
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // Company information
  getCompanyInfo(): Promise<CompanyInfo[]>;
  getCompanyInfoBySection(section: string): Promise<CompanyInfo[]>;
  createCompanyInfo(info: InsertCompanyInfo): Promise<CompanyInfo>;
  updateCompanyInfo(id: number, info: Partial<InsertCompanyInfo>): Promise<CompanyInfo>;
  
  // News and announcements
  getPublishedNews(): Promise<News[]>;
  getAllNews(): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<News>;
  deleteNews(id: number): Promise<void>;
  
  // Certifications
  getActiveCertifications(): Promise<Certification[]>;
  getAllCertifications(): Promise<Certification[]>;
  createCertification(cert: InsertCertification): Promise<Certification>;
  updateCertification(id: number, cert: Partial<InsertCertification>): Promise<Certification>;
  deleteCertification(id: number): Promise<void>;
}

export class ShowcaseStorage implements IShowcaseStorage {
  // Showcase Products
  async getShowcaseProducts(): Promise<ShowcaseProduct[]> {
    return await showcaseDb
      .select()
      .from(showcaseProducts)
      .where(eq(showcaseProducts.isActive, true))
      .orderBy(showcaseProducts.displayOrder, showcaseProducts.name);
  }

  // Get ALL showcase products (including inactive ones) for admin operations
  async getAllShowcaseProducts(): Promise<ShowcaseProduct[]> {
    return await showcaseDb
      .select()
      .from(showcaseProducts)
      .orderBy(showcaseProducts.displayOrder, showcaseProducts.name);
  }

  async getShowcaseProductsByCategory(category: string): Promise<ShowcaseProduct[]> {
    return await showcaseDb
      .select()
      .from(showcaseProducts)
      .where(eq(showcaseProducts.category, category))
      .orderBy(showcaseProducts.displayOrder, showcaseProducts.name);
  }

  async getShowcaseProductById(id: number): Promise<ShowcaseProduct | undefined> {
    const [product] = await showcaseDb
      .select()
      .from(showcaseProducts)
      .where(eq(showcaseProducts.id, id));
    return product;
  }

  async createShowcaseProduct(product: InsertShowcaseProduct): Promise<ShowcaseProduct> {
    const [newProduct] = await showcaseDb
      .insert(showcaseProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateShowcaseProduct(id: number, productUpdate: Partial<InsertShowcaseProduct>): Promise<ShowcaseProduct> {
    const [updatedProduct] = await showcaseDb
      .update(showcaseProducts)
      .set({ ...productUpdate, updatedAt: new Date() })
      .where(eq(showcaseProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteShowcaseProduct(id: number): Promise<void> {
    await showcaseDb
      .delete(showcaseProducts)
      .where(eq(showcaseProducts.id, id));
  }

  // Contacts
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await showcaseDb
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await showcaseDb
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));
  }

  // Company Info
  async getCompanyInfo(): Promise<CompanyInfo[]> {
    return await showcaseDb
      .select()
      .from(companyInfo)
      .where(eq(companyInfo.isActive, true))
      .orderBy(companyInfo.section, companyInfo.displayOrder);
  }

  async getCompanyInfoBySection(section: string): Promise<CompanyInfo[]> {
    return await showcaseDb
      .select()
      .from(companyInfo)
      .where(eq(companyInfo.section, section))
      .orderBy(companyInfo.displayOrder);
  }

  async createCompanyInfo(info: InsertCompanyInfo): Promise<CompanyInfo> {
    const [newInfo] = await showcaseDb
      .insert(companyInfo)
      .values(info)
      .returning();
    return newInfo;
  }

  async updateCompanyInfo(id: number, infoUpdate: Partial<InsertCompanyInfo>): Promise<CompanyInfo> {
    const [updatedInfo] = await showcaseDb
      .update(companyInfo)
      .set({ ...infoUpdate, updatedAt: new Date() })
      .where(eq(companyInfo.id, id))
      .returning();
    return updatedInfo;
  }

  // News
  async getPublishedNews(): Promise<News[]> {
    return await showcaseDb
      .select()
      .from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishDate));
  }

  async getAllNews(): Promise<News[]> {
    return await showcaseDb
      .select()
      .from(news)
      .orderBy(desc(news.createdAt));
  }

  async getNewsById(id: number): Promise<News | undefined> {
    const [newsItem] = await showcaseDb
      .select()
      .from(news)
      .where(eq(news.id, id));
    return newsItem;
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [newNews] = await showcaseDb
      .insert(news)
      .values(newsData)
      .returning();
    return newNews;
  }

  async updateNews(id: number, newsUpdate: Partial<InsertNews>): Promise<News> {
    const [updatedNews] = await showcaseDb
      .update(news)
      .set({ ...newsUpdate, updatedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    return updatedNews;
  }

  async deleteNews(id: number): Promise<void> {
    await showcaseDb
      .delete(news)
      .where(eq(news.id, id));
  }

  // Certifications
  async getActiveCertifications(): Promise<Certification[]> {
    return await showcaseDb
      .select()
      .from(certifications)
      .where(eq(certifications.isActive, true))
      .orderBy(desc(certifications.issueDate));
  }

  async getAllCertifications(): Promise<Certification[]> {
    return await showcaseDb
      .select()
      .from(certifications)
      .orderBy(desc(certifications.createdAt));
  }

  async createCertification(cert: InsertCertification): Promise<Certification> {
    const [newCert] = await showcaseDb
      .insert(certifications)
      .values(cert)
      .returning();
    return newCert;
  }

  async updateCertification(id: number, certUpdate: Partial<InsertCertification>): Promise<Certification> {
    const [updatedCert] = await showcaseDb
      .update(certifications)
      .set(certUpdate)
      .where(eq(certifications.id, id))
      .returning();
    return updatedCert;
  }

  async deleteCertification(id: number): Promise<void> {
    await showcaseDb
      .delete(certifications)
      .where(eq(certifications.id, id));
  }
}

export const showcaseStorage = new ShowcaseStorage();
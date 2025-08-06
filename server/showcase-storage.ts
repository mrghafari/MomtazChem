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
import { shopStorage } from "./shop-storage";

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
    const productData = {
      ...product,
      unitPrice: product.unitPrice ? product.unitPrice.toString() : "0.00"
    };
    
    const [newProduct] = await showcaseDb
      .insert(showcaseProducts)
      .values(productData)
      .returning();
    return newProduct;
  }

  async updateShowcaseProduct(id: number, productUpdate: Partial<InsertShowcaseProduct>): Promise<ShowcaseProduct> {
    const updateData = {
      ...productUpdate,
      updatedAt: new Date(),
      ...(productUpdate.unitPrice !== undefined && { unitPrice: productUpdate.unitPrice.toString() })
    };
    
    const [updatedProduct] = await showcaseDb
      .update(showcaseProducts)
      .set(updateData)
      .where(eq(showcaseProducts.id, id))
      .returning();
    
    // Auto-sync to shop if syncWithShop is enabled and any image was updated
    if (updatedProduct && updatedProduct.syncWithShop && (productUpdate.imageUrl || productUpdate.imageUrls)) {
      console.log(`🖼️ Images updated for ${updatedProduct.name}, syncing to shop...`);
      await this.syncProductToShop(updatedProduct);
    }
    
    return updatedProduct;
  }

  // Sync product to shop
  async syncProductToShop(showcaseProduct: ShowcaseProduct): Promise<void> {
    try {
      if (!showcaseProduct.syncWithShop) {
        console.log(`⚠️ Skipping sync for ${showcaseProduct.name} - syncWithShop is disabled`);
        return;
      }

      // Check if product exists in shop by name
      const allShopProducts = await shopStorage.getShopProducts();
      const existingShopProduct = allShopProducts.find(p => p.name === showcaseProduct.name);
      
      if (existingShopProduct) {
        // Update existing shop product, focusing on image sync AND document fields
        await shopStorage.updateShopProduct(existingShopProduct.id, {
          imageUrls: showcaseProduct.imageUrl ? [showcaseProduct.imageUrl] : [],
          thumbnailUrl: showcaseProduct.imageUrl || null,
          price: showcaseProduct.unitPrice?.toString() || existingShopProduct.price,
          stockQuantity: showcaseProduct.stockQuantity || existingShopProduct.stockQuantity,
          description: showcaseProduct.description || existingShopProduct.description,
          // Document fields sync
          showCatalogToCustomers: showcaseProduct.showCatalogToCustomers || false,
          showMsdsToCustomers: showcaseProduct.showMsdsToCustomers || false,
          pdfCatalogUrl: showcaseProduct.pdfCatalogUrl || null,
          msdsUrl: showcaseProduct.msdsUrl || null,
        });
        console.log(`✅ Image synced to shop: ${showcaseProduct.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to sync product to shop: ${showcaseProduct.name}`, error);
    }
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
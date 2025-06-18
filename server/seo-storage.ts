import { desc, eq, and, like } from "drizzle-orm";
import { seoDb } from "./seo-db";
import {
  seoSettings,
  seoAnalytics,
  sitemapEntries,
  redirects,
  type InsertSeoSetting,
  type SeoSetting,
  type InsertSeoAnalytics,
  type SeoAnalytics,
  type InsertSitemapEntry,
  type SitemapEntry,
  type InsertRedirect,
  type Redirect,
} from "../shared/schema";

export interface ISeoStorage {
  // SEO Settings Management
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSettingById(id: number): Promise<SeoSetting | undefined>;
  getSeoSettingByPage(pageType: string, pageIdentifier?: string): Promise<SeoSetting | undefined>;
  updateSeoSetting(id: number, setting: Partial<InsertSeoSetting>): Promise<SeoSetting>;
  deleteSeoSetting(id: number): Promise<void>;
  
  // SEO Analytics
  createSeoAnalytics(analytics: InsertSeoAnalytics): Promise<SeoAnalytics>;
  getSeoAnalytics(seoSettingId: number, limit?: number): Promise<SeoAnalytics[]>;
  getSeoAnalyticsSummary(): Promise<{
    totalImpressions: number;
    totalClicks: number;
    averageCtr: number;
    averagePosition: number;
    topPages: Array<{
      pageUrl: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
    }>;
  }>;
  
  // Sitemap Management
  createSitemapEntry(entry: InsertSitemapEntry): Promise<SitemapEntry>;
  getSitemapEntries(): Promise<SitemapEntry[]>;
  updateSitemapEntry(id: number, entry: Partial<InsertSitemapEntry>): Promise<SitemapEntry>;
  deleteSitemapEntry(id: number): Promise<void>;
  generateSitemap(): Promise<string>; // Returns XML sitemap
  
  // Redirects Management
  createRedirect(redirect: InsertRedirect): Promise<Redirect>;
  getRedirects(): Promise<Redirect[]>;
  getRedirectByFromUrl(fromUrl: string): Promise<Redirect | undefined>;
  updateRedirect(id: number, redirect: Partial<InsertRedirect>): Promise<Redirect>;
  deleteRedirect(id: number): Promise<void>;
  incrementRedirectHit(id: number): Promise<void>;
  
  // Utility functions
  generateRobotsTxt(): Promise<string>;
  validateSeoSettings(setting: InsertSeoSetting): Promise<string[]>; // Returns validation errors
}

export class SeoStorage implements ISeoStorage {
  async createSeoSetting(settingData: InsertSeoSetting): Promise<SeoSetting> {
    const [setting] = await seoDb.insert(seoSettings).values(settingData).returning();
    return setting;
  }

  async getSeoSettings(): Promise<SeoSetting[]> {
    return await seoDb.select().from(seoSettings).orderBy(desc(seoSettings.createdAt));
  }

  async getSeoSettingById(id: number): Promise<SeoSetting | undefined> {
    const [setting] = await seoDb.select().from(seoSettings).where(eq(seoSettings.id, id));
    return setting;
  }

  async getSeoSettingByPage(pageType: string, pageIdentifier?: string): Promise<SeoSetting | undefined> {
    const conditions = [eq(seoSettings.pageType, pageType), eq(seoSettings.isActive, true)];
    
    if (pageIdentifier) {
      conditions.push(eq(seoSettings.pageIdentifier, pageIdentifier));
    } else {
      conditions.push(eq(seoSettings.pageIdentifier, null));
    }

    const [setting] = await seoDb.select().from(seoSettings).where(and(...conditions));
    return setting;
  }

  async updateSeoSetting(id: number, settingUpdate: Partial<InsertSeoSetting>): Promise<SeoSetting> {
    const [setting] = await seoDb
      .update(seoSettings)
      .set({ ...settingUpdate, updatedAt: new Date() })
      .where(eq(seoSettings.id, id))
      .returning();
    return setting;
  }

  async deleteSeoSetting(id: number): Promise<void> {
    await seoDb.delete(seoSettings).where(eq(seoSettings.id, id));
  }

  async createSeoAnalytics(analyticsData: InsertSeoAnalytics): Promise<SeoAnalytics> {
    const [analytics] = await seoDb.insert(seoAnalytics).values(analyticsData).returning();
    return analytics;
  }

  async getSeoAnalytics(seoSettingId: number, limit: number = 100): Promise<SeoAnalytics[]> {
    return await seoDb
      .select()
      .from(seoAnalytics)
      .where(eq(seoAnalytics.seoSettingId, seoSettingId))
      .orderBy(desc(seoAnalytics.dateRecorded))
      .limit(limit);
  }

  async getSeoAnalyticsSummary(): Promise<{
    totalImpressions: number;
    totalClicks: number;
    averageCtr: number;
    averagePosition: number;
    topPages: Array<{
      pageUrl: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
    }>;
  }> {
    // This would typically involve complex aggregation queries
    // For now, returning a basic implementation
    const allAnalytics = await seoDb.select().from(seoAnalytics);
    
    const totalImpressions = allAnalytics.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalClicks = allAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const averagePosition = allAnalytics.length > 0 
      ? allAnalytics.reduce((sum, a) => sum + (parseFloat(a.position?.toString() || "0")), 0) / allAnalytics.length 
      : 0;

    // Get top 10 pages by impressions
    const topPages = allAnalytics
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 10)
      .map(a => ({
        pageUrl: a.pageUrl,
        impressions: a.impressions || 0,
        clicks: a.clicks || 0,
        ctr: parseFloat(a.ctr?.toString() || "0"),
        position: parseFloat(a.position?.toString() || "0"),
      }));

    return {
      totalImpressions,
      totalClicks,
      averageCtr,
      averagePosition,
      topPages,
    };
  }

  async createSitemapEntry(entryData: InsertSitemapEntry): Promise<SitemapEntry> {
    const [entry] = await seoDb.insert(sitemapEntries).values(entryData).returning();
    return entry;
  }

  async getSitemapEntries(): Promise<SitemapEntry[]> {
    return await seoDb
      .select()
      .from(sitemapEntries)
      .where(eq(sitemapEntries.isActive, true))
      .orderBy(desc(sitemapEntries.priority));
  }

  async updateSitemapEntry(id: number, entryUpdate: Partial<InsertSitemapEntry>): Promise<SitemapEntry> {
    const [entry] = await seoDb
      .update(sitemapEntries)
      .set({ ...entryUpdate, lastModified: new Date() })
      .where(eq(sitemapEntries.id, id))
      .returning();
    return entry;
  }

  async deleteSitemapEntry(id: number): Promise<void> {
    await seoDb.delete(sitemapEntries).where(eq(sitemapEntries.id, id));
  }

  async generateSitemap(): Promise<string> {
    const entries = await this.getSitemapEntries();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      xml += `    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${entry.changeFreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    return xml;
  }

  async createRedirect(redirectData: InsertRedirect): Promise<Redirect> {
    const [redirect] = await seoDb.insert(redirects).values(redirectData).returning();
    return redirect;
  }

  async getRedirects(): Promise<Redirect[]> {
    return await seoDb.select().from(redirects).orderBy(desc(redirects.createdAt));
  }

  async getRedirectByFromUrl(fromUrl: string): Promise<Redirect | undefined> {
    const [redirect] = await seoDb
      .select()
      .from(redirects)
      .where(and(eq(redirects.fromUrl, fromUrl), eq(redirects.isActive, true)));
    return redirect;
  }

  async updateRedirect(id: number, redirectUpdate: Partial<InsertRedirect>): Promise<Redirect> {
    const [redirect] = await seoDb
      .update(redirects)
      .set({ ...redirectUpdate, updatedAt: new Date() })
      .where(eq(redirects.id, id))
      .returning();
    return redirect;
  }

  async deleteRedirect(id: number): Promise<void> {
    await seoDb.delete(redirects).where(eq(redirects.id, id));
  }

  async incrementRedirectHit(id: number): Promise<void> {
    await seoDb
      .update(redirects)
      .set({ hitCount: redirects.hitCount + 1 })
      .where(eq(redirects.id, id));
  }

  async generateRobotsTxt(): Promise<string> {
    const settings = await this.getSeoSettings();
    const globalSetting = settings.find(s => s.pageType === 'global');
    
    let robotsTxt = 'User-agent: *\n';
    
    // Add disallow rules based on robots meta settings
    if (globalSetting?.robots?.includes('noindex')) {
      robotsTxt += 'Disallow: /\n';
    } else {
      robotsTxt += 'Disallow: /admin/\n';
      robotsTxt += 'Disallow: /api/\n';
      robotsTxt += 'Allow: /\n';
    }
    
    robotsTxt += '\n';
    robotsTxt += 'Sitemap: /sitemap.xml\n';
    
    return robotsTxt;
  }

  async validateSeoSettings(setting: InsertSeoSetting): Promise<string[]> {
    const errors: string[] = [];
    
    // Title validation
    if (!setting.title || setting.title.length < 10) {
      errors.push('Title must be at least 10 characters long');
    }
    if (setting.title && setting.title.length > 60) {
      errors.push('Title should not exceed 60 characters for better SEO');
    }
    
    // Description validation
    if (!setting.description || setting.description.length < 50) {
      errors.push('Description must be at least 50 characters long');
    }
    if (setting.description && setting.description.length > 160) {
      errors.push('Description should not exceed 160 characters for better SEO');
    }
    
    // Check for duplicate settings
    const existing = await this.getSeoSettingByPage(setting.pageType, setting.pageIdentifier);
    if (existing) {
      errors.push('SEO settings already exist for this page');
    }
    
    return errors;
  }
}

export const seoStorage = new SeoStorage();
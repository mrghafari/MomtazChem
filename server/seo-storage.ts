import { desc, eq, and, like, sql } from "drizzle-orm";
import { seoDb } from "./seo-db";
import {
  seoSettings,
  seoAnalytics,
  sitemapEntries,
  redirects,
  supportedLanguages,
  multilingualKeywords,
  type InsertSeoSetting,
  type SeoSetting,
  type InsertSeoAnalytics,
  type SeoAnalytics,
  type InsertSitemapEntry,
  type SitemapEntry,
  type InsertRedirect,
  type Redirect,
  type InsertSupportedLanguage,
  type SupportedLanguage,
  type InsertMultilingualKeyword,
  type MultilingualKeyword,
} from "../shared/schema";

export interface ISeoStorage {
  // SEO Settings Management
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  getSeoSettings(language?: string): Promise<SeoSetting[]>;
  getSeoSettingById(id: number): Promise<SeoSetting | undefined>;
  getSeoSettingByPage(pageType: string, language?: string, pageIdentifier?: string): Promise<SeoSetting | undefined>;
  updateSeoSetting(id: number, setting: Partial<InsertSeoSetting>): Promise<SeoSetting>;
  deleteSeoSetting(id: number): Promise<void>;
  
  // Language Management
  createSupportedLanguage(language: InsertSupportedLanguage): Promise<SupportedLanguage>;
  getSupportedLanguages(): Promise<SupportedLanguage[]>;
  getDefaultLanguage(): Promise<SupportedLanguage | undefined>;
  updateSupportedLanguage(id: number, language: Partial<InsertSupportedLanguage>): Promise<SupportedLanguage>;
  deleteSupportedLanguage(id: number): Promise<void>;
  
  // Multilingual Keywords Management
  createMultilingualKeyword(keyword: InsertMultilingualKeyword): Promise<MultilingualKeyword>;
  getMultilingualKeywords(seoSettingId?: number, language?: string): Promise<MultilingualKeyword[]>;
  updateKeywordPosition(id: number, position: number): Promise<void>;
  getKeywordPerformance(language?: string): Promise<{
    totalKeywords: number;
    averagePosition: number;
    topKeywords: Array<{
      keyword: string;
      position: number;
      language: string;
    }>;
  }>;
  
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
  getSitemapEntries(language?: string): Promise<SitemapEntry[]>;
  updateSitemapEntry(id: number, entry: Partial<InsertSitemapEntry>): Promise<SitemapEntry>;
  deleteSitemapEntry(id: number): Promise<void>;
  generateSitemap(language?: string): Promise<string>; // Returns XML sitemap
  generateMultilingualSitemap(): Promise<string>; // Returns sitemap index with all languages
  
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
  generateHreflangTags(pageType: string, pageIdentifier?: string): Promise<string[]>; // Returns hreflang tags
  getMultilingualAnalytics(): Promise<{
    byLanguage: Array<{
      language: string;
      totalImpressions: number;
      totalClicks: number;
      averagePosition: number;
    }>;
    byCountry: Array<{
      country: string;
      totalImpressions: number;
      totalClicks: number;
    }>;
  }>;
}

export class SeoStorage implements ISeoStorage {
  async createSeoSetting(settingData: InsertSeoSetting): Promise<SeoSetting> {
    const [setting] = await seoDb.insert(seoSettings).values(settingData).returning();
    return setting;
  }

  async getSeoSettings(language?: string): Promise<SeoSetting[]> {
    try {
      if (language && language !== 'all') {
        const results = await seoDb.select().from(seoSettings)
          .where(eq(seoSettings.language, language))
          .orderBy(desc(seoSettings.createdAt));
        return results;
      }
      
      const results = await seoDb.select().from(seoSettings)
        .orderBy(desc(seoSettings.createdAt));
      return results;
    } catch (error) {
      console.error('Error in getSeoSettings:', error);
      return [];
    }
  }

  async getSeoSettingById(id: number): Promise<SeoSetting | undefined> {
    const [setting] = await seoDb.select().from(seoSettings).where(eq(seoSettings.id, id));
    return setting;
  }

  async getSeoSettingByPage(pageType: string, language: string = 'fa', pageIdentifier?: string): Promise<SeoSetting | undefined> {
    let conditions = [
      eq(seoSettings.pageType, pageType),
      eq(seoSettings.language, language),
      eq(seoSettings.isActive, true)
    ];

    if (pageIdentifier) {
      conditions.push(eq(seoSettings.pageIdentifier, pageIdentifier));
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

  async getSitemapEntries(language?: string): Promise<SitemapEntry[]> {
    if (language) {
      return await seoDb.select().from(sitemapEntries)
        .where(and(eq(sitemapEntries.isActive, true), eq(sitemapEntries.language, language)))
        .orderBy(desc(sitemapEntries.priority));
    }
    
    return await seoDb.select().from(sitemapEntries)
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

  async generateSitemap(language?: string): Promise<string> {
    const entries = await this.getSitemapEntries(language);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    
    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      xml += `    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${entry.changeFreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      
      // Add hreflang alternatives for this URL
      const hreflangTags = await this.generateHreflangTags(entry.pageType || 'page');
      for (const tag of hreflangTags) {
        xml += `    ${tag}\n`;
      }
      
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    return xml;
  }

  async generateMultilingualSitemap(): Promise<string> {
    const languages = await this.getSupportedLanguages();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const language of languages) {
      if (language.isActive) {
        xml += '  <sitemap>\n';
        xml += `    <loc>/sitemap-${language.code}.xml</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
        xml += '  </sitemap>\n';
      }
    }
    
    xml += '</sitemapindex>';
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
    // Get current redirect first
    const redirect = await this.getRedirectByFromUrl('');
    if (redirect) {
      await seoDb
        .update(redirects)
        .set({ hitCount: (redirect.hitCount || 0) + 1 })
        .where(eq(redirects.id, id));
    }
  }

  async generateRobotsTxt(): Promise<string> {
    const settings = await this.getSeoSettings();
    const globalSetting = settings.find(s => s.pageType === 'global');
    
    let robotsTxt = 'User-agent: *\n';
    
    // Add disallow rules based on robots meta settings
    if (globalSetting?.robots && globalSetting.robots.includes('noindex')) {
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
    const existing = await this.getSeoSettingByPage(setting.pageType, setting.language || 'fa', setting.pageIdentifier || undefined);
    if (existing) {
      errors.push('SEO settings already exist for this page and language');
    }
    
    return errors;
  }

  // Language Management Methods
  async createSupportedLanguage(languageData: InsertSupportedLanguage): Promise<SupportedLanguage> {
    const [language] = await seoDb.insert(supportedLanguages).values(languageData).returning();
    return language;
  }

  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    return await seoDb.select().from(supportedLanguages).orderBy(desc(supportedLanguages.priority));
  }

  async getDefaultLanguage(): Promise<SupportedLanguage | undefined> {
    const [language] = await seoDb.select().from(supportedLanguages).where(eq(supportedLanguages.isDefault, true));
    return language;
  }

  async updateSupportedLanguage(id: number, languageUpdate: Partial<InsertSupportedLanguage>): Promise<SupportedLanguage> {
    const [language] = await seoDb
      .update(supportedLanguages)
      .set({ ...languageUpdate, updatedAt: new Date() })
      .where(eq(supportedLanguages.id, id))
      .returning();
    return language;
  }

  async deleteSupportedLanguage(id: number): Promise<void> {
    await seoDb.delete(supportedLanguages).where(eq(supportedLanguages.id, id));
  }

  // Multilingual Keywords Methods
  async createMultilingualKeyword(keywordData: InsertMultilingualKeyword): Promise<MultilingualKeyword> {
    const [keyword] = await seoDb.insert(multilingualKeywords).values(keywordData).returning();
    return keyword;
  }

  async getMultilingualKeywords(seoSettingId?: number, language?: string): Promise<MultilingualKeyword[]> {
    const conditions = [];
    if (seoSettingId) {
      conditions.push(eq(multilingualKeywords.seoSettingId, seoSettingId));
    }
    if (language) {
      conditions.push(eq(multilingualKeywords.language, language));
    }
    
    if (conditions.length > 0) {
      return await seoDb.select().from(multilingualKeywords)
        .where(and(...conditions))
        .orderBy(desc(multilingualKeywords.createdAt));
    }
    
    return await seoDb.select().from(multilingualKeywords)
      .orderBy(desc(multilingualKeywords.createdAt));
  }

  async updateKeywordPosition(id: number, position: number): Promise<void> {
    await seoDb
      .update(multilingualKeywords)
      .set({ 
        currentPosition: position, 
        lastChecked: new Date(),
        updatedAt: new Date()
      })
      .where(eq(multilingualKeywords.id, id));
  }

  async getKeywordPerformance(language?: string): Promise<{
    totalKeywords: number;
    averagePosition: number;
    topKeywords: Array<{
      keyword: string;
      position: number;
      language: string;
    }>;
  }> {
    let keywords: MultilingualKeyword[];
    
    if (language) {
      keywords = await seoDb.select().from(multilingualKeywords)
        .where(eq(multilingualKeywords.language, language));
    } else {
      keywords = await seoDb.select().from(multilingualKeywords);
    }
    
    const totalKeywords = keywords.length;
    const averagePosition = keywords.length > 0 
      ? keywords.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / keywords.length 
      : 0;
    
    const topKeywords = keywords
      .filter(k => k.currentPosition && k.currentPosition <= 10)
      .sort((a, b) => (a.currentPosition || 100) - (b.currentPosition || 100))
      .slice(0, 10)
      .map(k => ({
        keyword: k.keyword,
        position: k.currentPosition || 0,
        language: k.language,
      }));

    return {
      totalKeywords,
      averagePosition,
      topKeywords,
    };
  }

  async generateHreflangTags(pageType: string, pageIdentifier?: string): Promise<string[]> {
    const settings = await this.getSeoSettings();
    const pageSettings = settings.filter(s => 
      s.pageType === pageType && 
      s.pageIdentifier === pageIdentifier &&
      s.isActive
    );
    
    const hreflangTags: string[] = [];
    
    for (const setting of pageSettings) {
      if (setting.hreflangUrl) {
        hreflangTags.push(
          `<xhtml:link rel="alternate" hreflang="${setting.language}" href="${setting.hreflangUrl}" />`
        );
      }
    }
    
    return hreflangTags;
  }

  async getMultilingualAnalytics(): Promise<{
    byLanguage: Array<{
      language: string;
      totalImpressions: number;
      totalClicks: number;
      averagePosition: number;
    }>;
    byCountry: Array<{
      country: string;
      totalImpressions: number;
      totalClicks: number;
    }>;
  }> {
    const analytics = await seoDb.select().from(seoAnalytics);
    
    // Group by language
    const languageMap = new Map<string, { impressions: number; clicks: number; positions: number[] }>();
    const countryMap = new Map<string, { impressions: number; clicks: number }>();
    
    for (const record of analytics) {
      // Language statistics
      if (!languageMap.has(record.language)) {
        languageMap.set(record.language, { impressions: 0, clicks: 0, positions: [] });
      }
      const langData = languageMap.get(record.language)!;
      langData.impressions += record.impressions || 0;
      langData.clicks += record.clicks || 0;
      if (record.position) {
        langData.positions.push(parseFloat(record.position.toString()));
      }
      
      // Country statistics
      if (record.country) {
        if (!countryMap.has(record.country)) {
          countryMap.set(record.country, { impressions: 0, clicks: 0 });
        }
        const countryData = countryMap.get(record.country)!;
        countryData.impressions += record.impressions || 0;
        countryData.clicks += record.clicks || 0;
      }
    }
    
    const byLanguage = Array.from(languageMap.entries()).map(([language, data]) => ({
      language,
      totalImpressions: data.impressions,
      totalClicks: data.clicks,
      averagePosition: data.positions.length > 0 
        ? data.positions.reduce((sum, pos) => sum + pos, 0) / data.positions.length 
        : 0,
    }));
    
    const byCountry = Array.from(countryMap.entries()).map(([country, data]) => ({
      country,
      totalImpressions: data.impressions,
      totalClicks: data.clicks,
    }));
    
    return { byLanguage, byCountry };
  }
}

export const seoStorage = new SeoStorage();
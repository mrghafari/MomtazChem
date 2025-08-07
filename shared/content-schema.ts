import { pgTable, serial, text, boolean, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Content items table for managing website text content
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull(), // Unique identifier for content piece
  content: text("content").notNull(), // The actual content (text, HTML, etc.)
  contentType: varchar("content_type", { length: 50 }).notNull().default("text"), // text, html, json
  language: varchar("language", { length: 5 }).notNull().default("en"), // en, ar, ku
  section: varchar("section", { length: 100 }).notNull(), // homepage, about, products, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Image assets table for managing uploaded images
export const imageAssets = pgTable("image_assets", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(), // Generated filename
  originalName: varchar("original_name", { length: 255 }).notNull(), // Original uploaded filename
  mimeType: varchar("mime_type", { length: 100 }).notNull(), // image/jpeg, image/png, etc.
  size: integer("size").notNull(), // File size in bytes
  url: text("url").notNull(), // Full URL to access the image
  alt: text("alt"), // Alt text for accessibility
  section: varchar("section", { length: 100 }).notNull(), // Section where image is used
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Theme settings table for managing visual customization
export const themeSettings = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // setting key
  value: text("value").notNull(), // setting value (JSON string for complex values)
  category: varchar("category", { length: 50 }).notNull(), // colors, typography, layout, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Footer settings table for comprehensive footer management
export const footerSettings = pgTable("footer_settings", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 5 }).notNull().default("en"), // en, ar, ku, tr
  
  // Company Information
  companyName: text("company_name").notNull().default("Momtazchem"),
  companyDescription: text("company_description"),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone", { length: 20 }),
  companyEmail: varchar("company_email", { length: 100 }),
  companyCodal: varchar("company_codal", { length: 20 }),
  
  // Social Media Links
  facebookUrl: text("facebook_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  telegramUrl: text("telegram_url"),
  whatsappUrl: text("whatsapp_url"),
  wechatUrl: text("wechat_url"),
  wechatQr: text("wechat_qr"), // QR code image URL for WeChat
  
  // Footer Links (JSON format for flexibility)
  productLinks: text("product_links"), // JSON array of {name, href}
  companyLinks: text("company_links"), // JSON array of {name, href}
  supportLinks: text("support_links"), // JSON array of {name, href}
  legalLinks: text("legal_links"), // JSON array of {name, href}
  
  // Footer Content
  copyrightText: text("copyright_text"),
  additionalInfo: text("additional_info"),
  
  // Display Settings
  showSocialMedia: boolean("show_social_media").default(true),
  showCompanyInfo: boolean("show_company_info").default(true),
  showLinks: boolean("show_links").default(true),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Zod schemas for validation
export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertImageAssetSchema = createInsertSchema(imageAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertThemeSettingSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFooterSettingSchema = createInsertSchema(footerSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// TypeScript types
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;

export type ImageAsset = typeof imageAssets.$inferSelect;
export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;

export type ThemeSetting = typeof themeSettings.$inferSelect;
export type InsertThemeSetting = z.infer<typeof insertThemeSettingSchema>;

export type FooterSetting = typeof footerSettings.$inferSelect;
export type InsertFooterSetting = z.infer<typeof insertFooterSettingSchema>;

// Content types enum
export const ContentTypes = {
  TEXT: "text",
  HTML: "html",
  JSON: "json",
  IMAGE: "image"
} as const;

// Language codes enum
export const Languages = {
  ENGLISH: "en",
  ARABIC: "ar", 
  KURDISH: "ku"
} as const;

// Common content sections
export const ContentSections = {
  HOMEPAGE: "homepage",
  ABOUT: "about",
  PRODUCTS: "products",
  CONTACT: "contact",
  FOOTER: "footer",
  NAVIGATION: "navigation",
  HERO: "hero",
  TESTIMONIALS: "testimonials"
} as const;

// Social Media Platforms
export const SocialMediaPlatforms = {
  FACEBOOK: "facebook",
  TWITTER: "twitter", 
  LINKEDIN: "linkedin",
  INSTAGRAM: "instagram",
  YOUTUBE: "youtube",
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
  WECHAT: "wechat"
} as const;
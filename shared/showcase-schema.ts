import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// SHOWCASE WEBSITE SCHEMA - For product presentation and company information
// =============================================================================

// Contact form submissions from the main website
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  productInterest: text("product_interest").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Showcase products - for display and information purposes only
export const showcaseProducts = pgTable("showcase_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // fuel-additives, water-treatment, paint-thinner, agricultural-fertilizers
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  priceRange: text("price_range"), // "25-30 USD per liter" for display only
  imageUrl: text("image_url"),
  pdfCatalogUrl: text("pdf_catalog_url"),
  specifications: json("specifications"), // Technical specifications for display
  features: json("features"), // Product features array
  applications: json("applications"), // Applications array
  technicalDataSheet: text("technical_data_sheet_url"),
  safetyDataSheet: text("safety_data_sheet_url"),
  // MSDS (Material Safety Data Sheet) fields
  msdsUrl: text("msds_url"), // URL to MSDS PDF file
  showMsdsToCustomers: boolean("show_msds_to_customers").default(false), // Checkbox to control visibility
  msdsFileName: text("msds_file_name"), // Original filename for display
  msdsUploadDate: timestamp("msds_upload_date"), // When MSDS was uploaded
  certifications: json("certifications"), // Array of certifications
  tags: text("tags"), // Product tags for search and filtering
  // Publication permissions for shop display
  publishShortDescription: boolean("publish_short_description").default(true),
  publishPriceRange: boolean("publish_price_range").default(true),
  publishSpecifications: boolean("publish_specifications").default(true),
  publishFeatures: boolean("publish_features").default(true),
  publishApplications: boolean("publish_applications").default(true),
  publishWeight: boolean("publish_weight").default(true),
  publishTags: boolean("publish_tags").default(true),
  publishCertifications: boolean("publish_certifications").default(false),
  // Inventory management fields
  stockQuantity: integer("stock_quantity").default(0), // Current stock level
  minStockLevel: integer("min_stock_level").default(10), // Minimum stock threshold
  maxStockLevel: integer("max_stock_level").default(1000), // Maximum stock capacity
  stockUnit: text("stock_unit").default("units"), // Unit of measurement (liters, kg, units, etc.)
  // Pricing fields
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Individual unit price - Required
  currency: text("currency").default("IQD"), // Currency code (USD, EUR, IQD)
  lastRestockDate: timestamp("last_restock_date"),
  supplier: text("supplier"), // Supplier information
  warehouseLocation: text("warehouse_location"), // Storage location
  batchNumber: text("batch_number"), // Current batch tracking
  expiryDate: timestamp("expiry_date"), // For chemicals with expiration
  // Weight fields
  weight: text("weight").notNull(), // Product weight - Required
  weightUnit: text("weight_unit").default("kg"), // Weight unit (kg, g, lb, oz, t)
  // Barcode system fields
  barcode: text("barcode").unique().notNull(), // Main product barcode - Required
  qrCode: text("qr_code"), // QR code data for additional product information
  sku: text("sku").unique(), // Stock Keeping Unit
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0), // For ordering on website
  syncWithShop: boolean("sync_with_shop").default(true), // Whether to include in shop sync process
  // Product Variant Fields
  isVariant: boolean("is_variant").default(false), // Whether this is a variant of another product
  parentProductId: integer("parent_product_id"), // Reference to parent product if this is a variant
  variantType: text("variant_type"), // packaging, size, concentration, quantity, weight, volume
  variantValue: text("variant_value"), // 1kg, 5L, 25kg bag, 80% concentration, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShowcaseProductSchema = createInsertSchema(showcaseProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitPrice: z.coerce.number().min(0),
});

export type InsertShowcaseProduct = z.infer<typeof insertShowcaseProductSchema>;
export type ShowcaseProduct = typeof showcaseProducts.$inferSelect;

// Company information and settings
export const companyInfo = pgTable("company_info", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // about, mission, vision, values, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyInfoSchema = createInsertSchema(companyInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyInfo = z.infer<typeof insertCompanyInfoSchema>;
export type CompanyInfo = typeof companyInfo.$inferSelect;

// News and announcements
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  publishDate: timestamp("publish_date").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

// Certifications and awards
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  issuedBy: text("issued_by").notNull(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  certificateUrl: text("certificate_url"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certifications.$inferSelect;
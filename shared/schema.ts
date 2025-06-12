import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // fuel-additives, water-treatment, paint-thinner, agricultural-fertilizers
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceUnit: text("price_unit"), // per liter, per kg, per ton
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  sku: text("sku"), // Stock Keeping Unit
  imageUrl: text("image_url"),
  pdfCatalogUrl: text("pdf_catalog_url"), // PDF catalog file path
  specifications: json("specifications"), // JSON object for product specs
  features: json("features"), // Array of feature strings
  applications: json("applications"), // Array of application strings
  technicalDataSheet: text("technical_data_sheet_url"), // TDS PDF URL
  safetyDataSheet: text("safety_data_sheet_url"), // SDS PDF URL
  minimumOrderQuantity: integer("minimum_order_quantity"),
  leadTime: text("lead_time"), // delivery time
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin, manager, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

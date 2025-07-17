import { pgTable, text, serial, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { showcaseProducts } from "./showcase-schema";

// =============================================================================
// KARDEX BATCH MANAGEMENT SCHEMA - For tracking product batches and quantities
// =============================================================================

// Kardex batch entries - for tracking new inventory additions with batch numbers
export const kardexBatches = pgTable("kardex_batches", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => showcaseProducts.id),
  batchNumber: text("batch_number").notNull(), // شماره بچ جدید
  quantity: integer("quantity").notNull(), // مقدار اضافه شده
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"), // قیمت واحد
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).default("0.00"), // ارزش کل
  productionDate: timestamp("production_date"), // تاریخ تولید
  expiryDate: timestamp("expiry_date"), // تاریخ انقضا
  supplier: text("supplier"), // تامین کننده
  warehouseLocation: text("warehouse_location"), // محل انبار
  notes: text("notes"), // یادداشت‌ها
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by"), // کاربر ایجادکننده
});

export const insertKardexBatchSchema = createInsertSchema(kardexBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalValue: true, // محاسبه خودکار
});

export type InsertKardexBatch = z.infer<typeof insertKardexBatchSchema>;
export type KardexBatch = typeof kardexBatches.$inferSelect;

// Schema for adding quantities to existing products
export const addQuantitySchema = z.object({
  productId: z.number().min(1, "شناسه محصول الزامی است"),
  batchNumber: z.string().min(1, "شماره بچ الزامی است"),
  quantity: z.number().min(1, "مقدار باید بیشتر از صفر باشد"),
  unitPrice: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد").optional(),
  productionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
  warehouseLocation: z.string().optional(),
  notes: z.string().optional(),
});

export type AddQuantityInput = z.infer<typeof addQuantitySchema>;
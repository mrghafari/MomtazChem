import { pgTable, text, serial, timestamp, decimal, boolean, integer, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// PERSISTENT CART SYSTEM
// =============================================================================
// این جدول سبد خرید مشتریان را در دیتابیس ذخیره می‌کند
// تا حین لاگین مجدد حفظ شود

export const persistentCarts = pgTable("persistent_carts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(), // شناسه مشتری
  productId: integer("product_id").notNull(), // شناسه محصول
  quantity: integer("quantity").notNull().default(1), // تعداد محصول در سبد
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // قیمت واحد (برای محفوظ ماندن قیمت)
  addedAt: timestamp("added_at").notNull().defaultNow(), // زمان اضافه شدن به سبد
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // آخرین بروزرسانی
  sessionId: varchar("session_id", { length: 255 }), // شناسه جلسه (اختیاری)
  isActive: boolean("is_active").default(true), // آیا این آیتم هنوز فعال است؟
  notes: text("notes"), // یادداشت‌های اضافی
});

export const insertPersistentCartSchema = createInsertSchema(persistentCarts);
export type InsertPersistentCart = z.infer<typeof insertPersistentCartSchema>;
export type PersistentCart = typeof persistentCarts.$inferSelect;

// Schema برای بروزرسانی سبد خرید
export const updatePersistentCartSchema = insertPersistentCartSchema.partial();
export type UpdatePersistentCart = z.infer<typeof updatePersistentCartSchema>;
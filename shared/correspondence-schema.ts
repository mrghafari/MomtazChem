import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Monthly correspondence tracking table
export const monthlyCorrespondence = pgTable("monthly_correspondence", {
  id: serial("id").primaryKey(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: text("customer_name").notNull(),
  specialistId: text("specialist_id").notNull(),
  specialistName: text("specialist_name").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  channel: varchar("channel", { length: 10 }).notNull(), // email, chat, phone
  type: varchar("type", { length: 10 }).notNull(), // incoming, outgoing
  status: varchar("status", { length: 10 }).notNull().default("active"), // active, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 1 month
});

// Insert schemas
export const insertMonthlyCorrespondenceSchema = createInsertSchema(monthlyCorrespondence);
export type InsertMonthlyCorrespondence = z.infer<typeof insertMonthlyCorrespondenceSchema>;
export type MonthlyCorrespondence = typeof monthlyCorrespondence.$inferSelect;
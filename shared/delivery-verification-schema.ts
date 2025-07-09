import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Delivery verification codes table
export const deliveryVerificationCodes = pgTable("delivery_verification_codes", {
  id: serial("id").primaryKey(),
  orderManagementId: integer("order_management_id").notNull(),
  customerOrderId: integer("customer_order_id").notNull(),
  verificationCode: varchar("verification_code", { length: 4 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  
  // Status tracking
  isActive: boolean("is_active").default(true),
  isUsed: boolean("is_used").default(false),
  smsSent: boolean("sms_sent").default(false),
  smsDelivered: boolean("sms_delivered").default(false),
  
  // Verification details
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"), // Courier/delivery person name
  verificationNotes: text("verification_notes"),
  
  // Delivery attempt tracking
  deliveryAttempts: integer("delivery_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  
  // Expiration (codes expire at end of day)
  expiresAt: timestamp("expires_at").notNull(),
  
  // SMS details
  smsProvider: varchar("sms_provider", { length: 50 }),
  smsMessageId: varchar("sms_message_id", { length: 100 }),
  smsSentAt: timestamp("sms_sent_at"),
  smsDeliveredAt: timestamp("sms_delivered_at"),
  smsFailureReason: text("sms_failure_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_codes_order_idx").on(table.customerOrderId),
  index("delivery_codes_code_idx").on(table.verificationCode),
  index("delivery_codes_phone_idx").on(table.customerPhone),
  index("delivery_codes_date_idx").on(table.createdAt),
  index("delivery_codes_active_idx").on(table.isActive),
]);

// Schema for inserting delivery verification codes
export const insertDeliveryVerificationCodeSchema = createInsertSchema(deliveryVerificationCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for verifying delivery codes
export const verifyDeliveryCodeSchema = z.object({
  verificationCode: z.string().length(4, "کد تأیید باید 4 رقم باشد"),
  customerOrderId: z.number().int().positive("شماره سفارش نامعتبر است"),
  courierName: z.string().min(1, "نام پیک الزامی است"),
  verificationNotes: z.string().optional(),
});

// Types
export type DeliveryVerificationCode = typeof deliveryVerificationCodes.$inferSelect;
export type InsertDeliveryVerificationCode = z.infer<typeof insertDeliveryVerificationCodeSchema>;
export type VerifyDeliveryCode = z.infer<typeof verifyDeliveryCodeSchema>;

// Daily SMS statistics table
export const dailySmsStats = pgTable("daily_sms_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalFailed: integer("total_failed").default(0),
  totalVerified: integer("total_verified").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("daily_sms_stats_date_idx").on(table.date),
]);

export type DailySmsStats = typeof dailySmsStats.$inferSelect;
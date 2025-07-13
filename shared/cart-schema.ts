import { pgTable, text, serial, timestamp, decimal, boolean, integer, json, varchar, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// ABANDONED CART MANAGEMENT SCHEMA
// =============================================================================

// Cart Sessions - Track active user carts with timestamps
export const cartSessions = pgTable("cart_sessions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  sessionId: text("session_id").notNull(),
  cartData: json("cart_data").notNull(), // JSON of cart items
  itemCount: integer("item_count").default(0),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).default("0.00"),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  isAbandoned: boolean("is_abandoned").default(false),
  abandonedAt: timestamp("abandoned_at"),
});

// Abandoned Cart Settings - Admin configurable settings
export const abandonedCartSettings = pgTable("abandoned_cart_settings", {
  id: serial("id").primaryKey(),
  timeoutMinutes: integer("timeout_minutes").default(30), // Time before cart is considered abandoned
  isEnabled: boolean("is_enabled").default(true),
  notificationTitle: text("notification_title").default("سبد خرید شما منتظر است!"),
  notificationMessage: text("notification_message").default("محصولات انتخابی شما در سبد خرید منتظر تکمیل خرید هستند. برای ادامه خرید کلیک کنید."),
  buttonText: text("button_text").default("ادامه خرید"),
  showDiscountOffer: boolean("show_discount_offer").default(false),
  discountPercentage: integer("discount_percentage").default(0),
  discountCode: text("discount_code"),
  maxNotifications: integer("max_notifications").default(3), // Max notifications per cart
  notificationIntervalMinutes: integer("notification_interval_minutes").default(60), // Interval between notifications
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Abandoned Cart Notifications - Track sent notifications
export const abandonedCartNotifications = pgTable("abandoned_cart_notifications", {
  id: serial("id").primaryKey(),
  cartSessionId: integer("cart_session_id").notNull().references(() => cartSessions.id),
  customerId: integer("customer_id").notNull(),
  notificationType: text("notification_type").default("browser"), // 'browser', 'email', 'sms'
  title: text("title").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  clickedAt: timestamp("clicked_at"),
  converted: boolean("converted").default(false), // Did user complete purchase
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cart Recovery Analytics - Track recovery rates
export const cartRecoveryAnalytics = pgTable("cart_recovery_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalAbandonedCarts: integer("total_abandoned_carts").default(0),
  notificationsSent: integer("notifications_sent").default(0),
  cartsRecovered: integer("carts_recovered").default(0),
  recoveryRate: decimal("recovery_rate", { precision: 5, scale: 2 }).default("0.00"),
  totalRecoveredValue: decimal("total_recovered_value", { precision: 10, scale: 2 }).default("0.00"),
  averageAbandonedValue: decimal("average_abandoned_value", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

export const insertCartSessionSchema = createInsertSchema(cartSessions);
export const insertAbandonedCartSettingsSchema = createInsertSchema(abandonedCartSettings);
export const insertAbandonedCartNotificationSchema = createInsertSchema(abandonedCartNotifications);
export const insertCartRecoveryAnalyticsSchema = createInsertSchema(cartRecoveryAnalytics);

// =============================================================================
// TYPESCRIPT TYPES
// =============================================================================

export type CartSession = typeof cartSessions.$inferSelect;
export type InsertCartSession = z.infer<typeof insertCartSessionSchema>;

export type AbandonedCartSettings = typeof abandonedCartSettings.$inferSelect;
export type InsertAbandonedCartSettings = z.infer<typeof insertAbandonedCartSettingsSchema>;

export type AbandonedCartNotification = typeof abandonedCartNotifications.$inferSelect;
export type InsertAbandonedCartNotification = z.infer<typeof insertAbandonedCartNotificationSchema>;

export type CartRecoveryAnalytics = typeof cartRecoveryAnalytics.$inferSelect;
export type InsertCartRecoveryAnalytics = z.infer<typeof insertCartRecoveryAnalyticsSchema>;
import { pgTable, text, integer, boolean, timestamp, decimal, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Orphan Orders Management Schema for comprehensive automation
export const orphanOrdersSettings = pgTable('orphan_orders_settings', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SMS Templates for orphan order notifications
export const orphanOrderSmsTemplates = pgTable('orphan_order_sms_templates', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  templateName: text('template_name').notNull(),
  templateContent: text('template_content').notNull(),
  variables: json('variables').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  language: text('language').default('ar'), // ar, en, ku, tr
  templateType: text('template_type').notNull(), // reminder, warning, final_notice, grace_expired
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Email Templates for orphan order notifications
export const orphanOrderEmailTemplates = pgTable('orphan_order_email_templates', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  templateName: text('template_name').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  variables: json('variables').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  language: text('language').default('ar'), // ar, en, ku, tr
  templateType: text('template_type').notNull(), // reminder, warning, final_notice, grace_expired
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Schedule Configuration
export const orphanOrderNotificationSchedule = pgTable('orphan_order_notification_schedule', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  scheduleName: text('schedule_name').notNull(),
  notificationType: text('notification_type').notNull(), // sms, email, both
  triggerDaysBefore: integer('trigger_days_before').notNull(), // Days before grace period expires
  triggerHoursBefore: integer('trigger_hours_before').default(0), // Additional hours
  maxNotifications: integer('max_notifications').default(3), // Maximum notifications per order
  isActive: boolean('is_active').default(true),
  smsTemplateId: integer('sms_template_id').references(() => orphanOrderSmsTemplates.id),
  emailTemplateId: integer('email_template_id').references(() => orphanOrderEmailTemplates.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Log for tracking sent notifications
export const orphanOrderNotificationLog = pgTable('orphan_order_notification_log', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  orderId: integer('order_id').notNull(),
  customerOrderId: integer('customer_order_id').notNull(),
  customerId: integer('customer_id').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  notificationType: text('notification_type').notNull(), // sms, email
  templateId: integer('template_id').notNull(),
  templateType: text('template_type').notNull(),
  scheduleId: integer('schedule_id').notNull().references(() => orphanOrderNotificationSchedule.id),
  sentAt: timestamp('sent_at').defaultNow(),
  status: text('status').notNull().default('sent'), // sent, failed, pending
  errorMessage: text('error_message'),
  responseData: json('response_data'),
  gracePeriodExpires: timestamp('grace_period_expires'),
  notificationCount: integer('notification_count').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orphan Orders Tracking
export const orphanOrdersTracking = pgTable('orphan_orders_tracking', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  orderId: integer('order_id').notNull().unique(),
  customerOrderId: integer('customer_order_id').notNull(),
  customerId: integer('customer_id').notNull(),
  orderStatus: text('order_status').notNull(),
  gracePeriodStart: timestamp('grace_period_start'),
  gracePeriodEnd: timestamp('grace_period_end'),
  isGracePeriodActive: boolean('is_grace_period_active').default(false),
  isGracePeriodExpired: boolean('is_grace_period_expired').default(false),
  totalNotificationsSent: integer('total_notifications_sent').default(0),
  lastNotificationSent: timestamp('last_notification_sent'),
  orderValue: decimal('order_value', { precision: 10, scale: 2 }),
  currency: text('currency').default('IQD'),
  paymentMethod: text('payment_method'),
  isOrderLocked: boolean('is_order_locked').default(false),
  lockReason: text('lock_reason'),
  assignedStaff: text('assigned_staff'),
  priority: text('priority').default('normal'), // low, normal, high, urgent
  internalNotes: text('internal_notes'),
  customerLanguage: text('customer_language').default('ar'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertOrphanOrdersSettingsSchema = createInsertSchema(orphanOrdersSettings);
export const insertOrphanOrderSmsTemplateSchema = createInsertSchema(orphanOrderSmsTemplates);
export const insertOrphanOrderEmailTemplateSchema = createInsertSchema(orphanOrderEmailTemplates);
export const insertOrphanOrderNotificationScheduleSchema = createInsertSchema(orphanOrderNotificationSchedule);
export const insertOrphanOrderNotificationLogSchema = createInsertSchema(orphanOrderNotificationLog);
export const insertOrphanOrdersTrackingSchema = createInsertSchema(orphanOrdersTracking);

// Types
export type OrphanOrdersSettings = typeof orphanOrdersSettings.$inferSelect;
export type InsertOrphanOrdersSettings = z.infer<typeof insertOrphanOrdersSettingsSchema>;

export type OrphanOrderSmsTemplate = typeof orphanOrderSmsTemplates.$inferSelect;
export type InsertOrphanOrderSmsTemplate = z.infer<typeof insertOrphanOrderSmsTemplateSchema>;

export type OrphanOrderEmailTemplate = typeof orphanOrderEmailTemplates.$inferSelect;
export type InsertOrphanOrderEmailTemplate = z.infer<typeof insertOrphanOrderEmailTemplateSchema>;

export type OrphanOrderNotificationSchedule = typeof orphanOrderNotificationSchedule.$inferSelect;
export type InsertOrphanOrderNotificationSchedule = z.infer<typeof insertOrphanOrderNotificationScheduleSchema>;

export type OrphanOrderNotificationLog = typeof orphanOrderNotificationLog.$inferSelect;
export type InsertOrphanOrderNotificationLog = z.infer<typeof insertOrphanOrderNotificationLogSchema>;

export type OrphanOrdersTracking = typeof orphanOrdersTracking.$inferSelect;
export type InsertOrphanOrdersTracking = z.infer<typeof insertOrphanOrdersTrackingSchema>;

// Configuration constants
export const NOTIFICATION_TYPES = {
  SMS: 'sms',
  EMAIL: 'email',
  BOTH: 'both'
} as const;

export const TEMPLATE_TYPES = {
  REMINDER: 'reminder',
  WARNING: 'warning',
  FINAL_NOTICE: 'final_notice',
  GRACE_EXPIRED: 'grace_expired'
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const LANGUAGES = {
  ARABIC: 'ar',
  ENGLISH: 'en',
  KURDISH: 'ku',
  TURKISH: 'tr'
} as const;
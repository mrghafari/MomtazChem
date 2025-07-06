import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Email Categories Table
export const emailCategories = pgTable("email_categories", {
  id: serial("id").primaryKey(),
  categoryKey: text("category_key").notNull().unique(), // fuel-additives, water-treatment, etc.
  categoryName: text("category_name").notNull(), // "Fuel Additives", "Water Treatment", etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMTP Settings Table - separate SMTP config for each category
export const smtpSettings = pgTable("smtp_settings", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => emailCategories.id),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  secure: boolean("secure").default(false),
  username: text("username").notNull(),
  password: text("password").notNull(), // Should be encrypted in production
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  isActive: boolean("is_active").default(true),
  testStatus: text("test_status").default("untested"), // untested, success, failed
  lastTested: timestamp("last_tested"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Recipients Table - who receives emails for each category
export const emailRecipients = pgTable("email_recipients", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => emailCategories.id),
  email: text("email").notNull(),
  name: text("name"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  receiveTypes: text("receive_types").array(), // ["inquiries", "orders", "notifications"]
  recipientType: text("recipient_type").default("to"), // "to", "cc", "bcc"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Category Email Assignment Table - maps product categories to specific email addresses
export const categoryEmailAssignments = pgTable("category_email_assignments", {
  id: serial("id").primaryKey(),
  categoryKey: text("category_key").notNull().unique(), // fuel-additives, water-treatment, etc.
  categoryName: text("category_name").notNull(), // Persian name for display
  assignedEmail: text("assigned_email").notNull(), // Email address for this category
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates Table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => emailCategories.id),
  templateKey: text("template_key").notNull(), // inquiry_notification, order_confirmation, etc.
  templateName: text("template_name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: text("variables").array(), // ["customerName", "productName", etc.]
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  language: text("language").default("en"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Logs Table - track sent emails
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => emailCategories.id),
  templateId: integer("template_id").references(() => emailTemplates.id),
  smtpId: integer("smtp_id").references(() => smtpSettings.id),
  toEmail: text("to_email").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull(), // sent, failed, pending
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Communications Table - for direct communication with customers per category
export const customerCommunications = pgTable("customer_communications", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => emailCategories.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").default("outbound"), // outbound, inbound, follow_up
  status: text("status").default("sent"), // sent, delivered, read, replied, failed
  sentBy: integer("sent_by"), // admin user ID who sent the message
  replyToMessageId: integer("reply_to_message_id").references(() => customerCommunications.id),
  attachments: text("attachments").array(), // array of file paths
  emailId: text("email_id"), // external email provider message ID
  readAt: timestamp("read_at"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type EmailCategory = typeof emailCategories.$inferSelect;
export type InsertEmailCategory = typeof emailCategories.$inferInsert;
export type SmtpSetting = typeof smtpSettings.$inferSelect;
export type InsertSmtpSetting = typeof smtpSettings.$inferInsert;
export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
export type CustomerCommunication = typeof customerCommunications.$inferSelect;
export type InsertCustomerCommunication = typeof customerCommunications.$inferInsert;

// Zod Schemas
export const insertEmailCategorySchema = createInsertSchema(emailCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmtpSettingSchema = createInsertSchema(smtpSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerCommunicationSchema = createInsertSchema(customerCommunications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategoryEmailAssignmentSchema = createInsertSchema(categoryEmailAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Validation schemas with additional rules
export const smtpConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1).max(65535, "Port must be between 1-65535"),
  secure: z.boolean(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().min(1, "From email is required"),
});

export const emailRecipientConfigSchema = z.object({
  email: z.string().email("Valid email address required"),
  name: z.string().optional(),
  isPrimary: z.boolean().default(false),
  receiveTypes: z.array(z.string()).min(1, "At least one receive type required"),
});

// Additional Export types for new table
export type CategoryEmailAssignment = typeof categoryEmailAssignments.$inferSelect;
export type InsertCategoryEmailAssignment = z.infer<typeof insertCategoryEmailAssignmentSchema>;
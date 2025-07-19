import { pgTable, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const emailTemplates = pgTable('email_templates', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  templateNumber: text('template_number').notNull().unique(),
  templateName: text('template_name').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  category: text('category').notNull(),
  description: text('description'),
  variables: json('variables').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  templateNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
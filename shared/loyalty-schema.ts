import { pgTable, serial, varchar, integer, decimal, timestamp, boolean, text, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Customer loyalty points table
export const customerLoyalty = pgTable('customer_loyalty', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  totalPoints: integer('total_points').default(0),
  usedPoints: integer('used_points').default(0),
  availablePoints: integer('available_points').default(0),
  tierLevel: varchar('tier_level', { length: 20 }).default('bronze'), // bronze, silver, gold
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  joinDate: timestamp('join_date').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Points transactions table
export const pointsTransactions = pgTable('points_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  orderId: integer('order_id'),
  transactionType: varchar('transaction_type', { length: 20 }).notNull(), // 'earned', 'redeemed', 'expired'
  pointsAmount: integer('points_amount').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  expiryDate: timestamp('expiry_date'),
});

// Loyalty rules configuration table
export const loyaltyRules = pgTable('loyalty_rules', {
  id: serial('id').primaryKey(),
  ruleName: varchar('rule_name', { length: 100 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'points_per_purchase', 'tier_threshold', 'discount_rate'
  ruleValue: decimal('rule_value', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IQD'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Discount codes generated from points
export const loyaltyDiscounts = pgTable('loyalty_discounts', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  discountCode: varchar('discount_code', { length: 20 }).unique().notNull(),
  pointsUsed: integer('points_used').notNull(),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
  isUsed: boolean('is_used').default(false),
  orderId: integer('order_id'),
  createdAt: timestamp('created_at').defaultNow(),
  expiryDate: timestamp('expiry_date').notNull(),
  usedAt: timestamp('used_at'),
});

// Customer tier benefits
export const tierBenefits = pgTable('tier_benefits', {
  id: serial('id').primaryKey(),
  tierLevel: varchar('tier_level', { length: 20 }).notNull(),
  benefitType: varchar('benefit_type', { length: 50 }).notNull(), // 'discount_multiplier', 'free_shipping', 'early_access'
  benefitValue: decimal('benefit_value', { precision: 10, scale: 2 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
});

// Zod schemas for validation
export const insertCustomerLoyaltySchema = createInsertSchema(customerLoyalty);
export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions);
export const insertLoyaltyRuleSchema = createInsertSchema(loyaltyRules);
export const insertLoyaltyDiscountSchema = createInsertSchema(loyaltyDiscounts);
export const insertTierBenefitSchema = createInsertSchema(tierBenefits);

// TypeScript types
export type CustomerLoyalty = typeof customerLoyalty.$inferSelect;
export type NewCustomerLoyalty = z.infer<typeof insertCustomerLoyaltySchema>;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type LoyaltyRule = typeof loyaltyRules.$inferSelect;
export type NewLoyaltyRule = z.infer<typeof insertLoyaltyRuleSchema>;
export type LoyaltyDiscount = typeof loyaltyDiscounts.$inferSelect;
export type NewLoyaltyDiscount = z.infer<typeof insertLoyaltyDiscountSchema>;
export type TierBenefit = typeof tierBenefits.$inferSelect;
export type NewTierBenefit = z.infer<typeof insertTierBenefitSchema>;

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 999999, name: 'برنزی', color: 'amber', multiplier: 1.0 },
  silver: { min: 1000000, max: 4999999, name: 'نقره‌ای', color: 'slate', multiplier: 1.5 },
  gold: { min: 5000000, max: Infinity, name: 'طلایی', color: 'yellow', multiplier: 2.0 },
};

// Points calculation rules
export const POINTS_RULES = {
  pointsPerIQD: 0.001, // 1 point per 1,000 IQD
  discountPointsRatio: 20, // 100 points = 5% discount
  pointsExpiryDays: 365,
};
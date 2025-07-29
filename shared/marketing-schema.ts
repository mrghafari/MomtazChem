import { z } from 'zod';
import { pgTable, serial, text, decimal, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// International Markets Table
export const internationalMarkets = pgTable('international_markets', {
  id: serial('id').primaryKey(),
  country: text('country').notNull(),
  countryCode: text('country_code').notNull(),
  region: text('region').notNull(), // middle_east, gulf, asia, europe, africa, americas
  marketSize: decimal('market_size').notNull(),
  growthRate: decimal('growth_rate').notNull(),
  competitionLevel: text('competition_level').notNull(), // low, medium, high
  marketPotential: text('market_potential').notNull(), // low, medium, high, very_high
  entryBarriers: json('entry_barriers').$type<string[]>().notNull().default([]),
  keyCustomers: json('key_customers').$type<string[]>().notNull().default([]),
  distributionChannels: json('distribution_channels').$type<string[]>().notNull().default([]),
  regulatoryRequirements: text('regulatory_requirements'),
  estimatedRevenue: decimal('estimated_revenue').notNull(),
  marketEntryDate: text('market_entry_date'),
  status: text('status').notNull().default('researched'), // researched, targeted, entered, active, paused
  priority: integer('priority').notNull().default(3), // 1-5 scale
  notes: text('notes'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Market Segments Table
export const marketSegments = pgTable('market_segments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  targetCountries: json('target_countries').$type<string[]>().notNull().default([]),
  productCategories: json('product_categories').$type<string[]>().notNull().default([]),
  customerProfile: text('customer_profile').notNull(),
  marketSize: decimal('market_size').notNull(),
  competitorAnalysis: text('competitor_analysis'),
  pricingStrategy: text('pricing_strategy'),
  marketingApproach: text('marketing_approach'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Competitor Analysis Table
export const competitorAnalysis = pgTable('competitor_analysis', {
  id: serial('id').primaryKey(),
  competitorName: text('competitor_name').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull(),
  marketShare: decimal('market_share'),
  strengths: json('strengths').$type<string[]>().notNull().default([]),
  weaknesses: json('weaknesses').$type<string[]>().notNull().default([]),
  productPortfolio: json('product_portfolio').$type<string[]>().notNull().default([]),
  pricingModel: text('pricing_model'),
  distributionStrategy: text('distribution_strategy'),
  marketingStrategy: text('marketing_strategy'),
  financialPerformance: text('financial_performance'),
  threatLevel: text('threat_level').notNull().default('medium'), // low, medium, high, critical
  opportunities: text('opportunities'),
  isActive: boolean('is_active').notNull().default(true),
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Market Intelligence Data Table
export const marketIntelligence = pgTable('market_intelligence', {
  id: serial('id').primaryKey(),
  region: text('region').notNull(),
  country: text('country'),
  dataType: text('data_type').notNull(), // trend, forecast, regulation, opportunity, threat
  title: text('title').notNull(),
  description: text('description').notNull(),
  source: text('source').notNull(),
  reliability: text('reliability').notNull().default('medium'), // low, medium, high, verified
  impact: text('impact').notNull().default('medium'), // low, medium, high, critical
  actionRequired: boolean('action_required').notNull().default(false),
  dueDate: timestamp('due_date'),
  assignedTo: text('assigned_to'),
  status: text('status').notNull().default('new'), // new, reviewed, in_progress, completed, archived
  tags: json('tags').$type<string[]>().notNull().default([]),
  attachments: json('attachments').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertInternationalMarketSchema = createInsertSchema(internationalMarkets).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertMarketSegmentSchema = createInsertSchema(marketSegments).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalysis).omit({
  id: true,
  createdAt: true,
  lastAnalyzed: true,
});

export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InternationalMarket = typeof internationalMarkets.$inferSelect;
export type InsertInternationalMarket = z.infer<typeof insertInternationalMarketSchema>;

export type MarketSegment = typeof marketSegments.$inferSelect;
export type InsertMarketSegment = z.infer<typeof insertMarketSegmentSchema>;

export type CompetitorAnalysis = typeof competitorAnalysis.$inferSelect;
export type InsertCompetitorAnalysis = z.infer<typeof insertCompetitorAnalysisSchema>;

export type MarketIntelligence = typeof marketIntelligence.$inferSelect;
export type InsertMarketIntelligence = z.infer<typeof insertMarketIntelligenceSchema>;
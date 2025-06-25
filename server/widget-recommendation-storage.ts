import { db } from "./db.js";
import { 
  dashboardWidgets, 
  userWidgetPreferences, 
  widgetUsageAnalytics, 
  widgetRecommendations,
  type DashboardWidget,
  type UserWidgetPreference,
  type WidgetUsageAnalytics,
  type WidgetRecommendation,
  type InsertDashboardWidget,
  type InsertUserWidgetPreference,
  type InsertWidgetUsageAnalytics,
  type InsertWidgetRecommendation
} from "../shared/schema.js";
import { eq, desc, sql, and, gte, lte, inArray, notInArray } from "drizzle-orm";

export interface IWidgetRecommendationStorage {
  // Dashboard widget management
  createWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  getWidgets(category?: string, userLevel?: string): Promise<DashboardWidget[]>;
  getWidgetById(id: number): Promise<DashboardWidget | undefined>;
  updateWidget(id: number, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget>;
  deactivateWidget(id: number): Promise<void>;

  // User widget preferences
  createUserPreference(preference: InsertUserWidgetPreference): Promise<UserWidgetPreference>;
  getUserPreferences(userId: number): Promise<UserWidgetPreference[]>;
  updateUserPreference(userId: number, widgetId: number, updates: Partial<InsertUserWidgetPreference>): Promise<UserWidgetPreference>;
  toggleWidgetVisibility(userId: number, widgetId: number): Promise<UserWidgetPreference>;
  starWidget(userId: number, widgetId: number): Promise<UserWidgetPreference>;
  updateWidgetPosition(userId: number, widgetId: number, position: number): Promise<UserWidgetPreference>;

  // Usage analytics tracking
  trackWidgetUsage(analytics: InsertWidgetUsageAnalytics): Promise<WidgetUsageAnalytics>;
  getWidgetUsageStats(widgetId: number, days?: number): Promise<{
    totalViews: number;
    totalClicks: number;
    averageTimeSpent: number;
    uniqueUsers: number;
    popularTimes: Array<{ hour: number; count: number }>;
  }>;
  getUserActivitySummary(userId: number, days?: number): Promise<{
    mostUsedWidgets: Array<{ widgetId: number; widgetName: string; usage: number }>;
    totalInteractions: number;
    averageSessionTime: number;
    preferredCategories: Array<{ category: string; usage: number }>;
  }>;

  // Recommendation engine
  generateRecommendations(userId: number): Promise<WidgetRecommendation[]>;
  getRecommendationsForUser(userId: number): Promise<WidgetRecommendation[]>;
  acceptRecommendation(userId: number, recommendationId: number): Promise<void>;
  dismissRecommendation(userId: number, recommendationId: number): Promise<void>;
  cleanupExpiredRecommendations(): Promise<void>;

  // Analytics and insights
  getPopularWidgets(limit?: number): Promise<Array<{
    widget: DashboardWidget;
    usageCount: number;
    uniqueUsers: number;
    averageRating: number;
  }>>;
  getTrendingWidgets(days?: number): Promise<Array<{
    widget: DashboardWidget;
    growthRate: number;
    currentUsage: number;
  }>>;
  getUserSimilarity(userId: number): Promise<Array<{
    similarUserId: number;
    similarity: number;
    commonWidgets: string[];
  }>>;
}

export class WidgetRecommendationStorage implements IWidgetRecommendationStorage {
  // Dashboard widget management
  async createWidget(widgetData: InsertDashboardWidget): Promise<DashboardWidget> {
    const [widget] = await db.insert(dashboardWidgets)
      .values(widgetData)
      .returning();
    return widget;
  }

  async getWidgets(category?: string, userLevel?: string): Promise<DashboardWidget[]> {
    let query = db.select().from(dashboardWidgets)
      .where(eq(dashboardWidgets.isActive, true));

    if (category) {
      query = query.where(eq(dashboardWidgets.category, category));
    }

    if (userLevel) {
      // Simple user level filtering - in real implementation you'd have more complex logic
      if (userLevel === 'admin') {
        query = query.where(inArray(dashboardWidgets.minUserLevel, ['admin', 'super_admin']));
      }
    }

    return query.orderBy(desc(dashboardWidgets.priority));
  }

  async getWidgetById(id: number): Promise<DashboardWidget | undefined> {
    const [widget] = await db.select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.id, id));
    return widget;
  }

  async updateWidget(id: number, widgetUpdate: Partial<InsertDashboardWidget>): Promise<DashboardWidget> {
    const [widget] = await db.update(dashboardWidgets)
      .set({ ...widgetUpdate, updatedAt: new Date() })
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return widget;
  }

  async deactivateWidget(id: number): Promise<void> {
    await db.update(dashboardWidgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dashboardWidgets.id, id));
  }

  // User widget preferences
  async createUserPreference(preferenceData: InsertUserWidgetPreference): Promise<UserWidgetPreference> {
    const [preference] = await db.insert(userWidgetPreferences)
      .values(preferenceData)
      .returning();
    return preference;
  }

  async getUserPreferences(userId: number): Promise<UserWidgetPreference[]> {
    return db.select()
      .from(userWidgetPreferences)
      .where(eq(userWidgetPreferences.userId, userId))
      .orderBy(userWidgetPreferences.position);
  }

  async updateUserPreference(userId: number, widgetId: number, updates: Partial<InsertUserWidgetPreference>): Promise<UserWidgetPreference> {
    const [preference] = await db.update(userWidgetPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(userWidgetPreferences.userId, userId),
        eq(userWidgetPreferences.widgetId, widgetId)
      ))
      .returning();
    return preference;
  }

  async toggleWidgetVisibility(userId: number, widgetId: number): Promise<UserWidgetPreference> {
    // First check if preference exists
    const [existing] = await db.select()
      .from(userWidgetPreferences)
      .where(and(
        eq(userWidgetPreferences.userId, userId),
        eq(userWidgetPreferences.widgetId, widgetId)
      ));

    if (existing) {
      const [updated] = await db.update(userWidgetPreferences)
        .set({ isVisible: !existing.isVisible, updatedAt: new Date() })
        .where(and(
          eq(userWidgetPreferences.userId, userId),
          eq(userWidgetPreferences.widgetId, widgetId)
        ))
        .returning();
      return updated;
    } else {
      // Create new preference with visible = true
      const [created] = await db.insert(userWidgetPreferences)
        .values({
          userId,
          widgetId,
          isVisible: true,
          position: 0
        })
        .returning();
      return created;
    }
  }

  async starWidget(userId: number, widgetId: number): Promise<UserWidgetPreference> {
    const [existing] = await db.select()
      .from(userWidgetPreferences)
      .where(and(
        eq(userWidgetPreferences.userId, userId),
        eq(userWidgetPreferences.widgetId, widgetId)
      ));

    if (existing) {
      const [updated] = await db.update(userWidgetPreferences)
        .set({ isStarred: !existing.isStarred, updatedAt: new Date() })
        .where(and(
          eq(userWidgetPreferences.userId, userId),
          eq(userWidgetPreferences.widgetId, widgetId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userWidgetPreferences)
        .values({
          userId,
          widgetId,
          isStarred: true,
          position: 0
        })
        .returning();
      return created;
    }
  }

  async updateWidgetPosition(userId: number, widgetId: number, position: number): Promise<UserWidgetPreference> {
    const [existing] = await db.select()
      .from(userWidgetPreferences)
      .where(and(
        eq(userWidgetPreferences.userId, userId),
        eq(userWidgetPreferences.widgetId, widgetId)
      ));

    if (existing) {
      const [updated] = await db.update(userWidgetPreferences)
        .set({ position, updatedAt: new Date() })
        .where(and(
          eq(userWidgetPreferences.userId, userId),
          eq(userWidgetPreferences.widgetId, widgetId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userWidgetPreferences)
        .values({
          userId,
          widgetId,
          position
        })
        .returning();
      return created;
    }
  }

  // Usage analytics tracking
  async trackWidgetUsage(analyticsData: InsertWidgetUsageAnalytics): Promise<WidgetUsageAnalytics> {
    const [analytics] = await db.insert(widgetUsageAnalytics)
      .values(analyticsData)
      .returning();

    // Update user preference stats
    await this.updateUserPreferenceStats(analyticsData.userId, analyticsData.widgetId, analyticsData.action, analyticsData.duration);

    return analytics;
  }

  private async updateUserPreferenceStats(userId: number, widgetId: number, action: string, duration?: number): Promise<void> {
    const [existing] = await db.select()
      .from(userWidgetPreferences)
      .where(and(
        eq(userWidgetPreferences.userId, userId),
        eq(userWidgetPreferences.widgetId, widgetId)
      ));

    const updates: Partial<InsertUserWidgetPreference> = {
      lastViewed: new Date(),
      updatedAt: new Date()
    };

    if (action === 'view') {
      updates.viewCount = (existing?.viewCount || 0) + 1;
      if (duration) {
        updates.timeSpent = (existing?.timeSpent || 0) + duration;
      }
    } else if (action === 'click') {
      updates.clickCount = (existing?.clickCount || 0) + 1;
    }

    if (existing) {
      await db.update(userWidgetPreferences)
        .set(updates)
        .where(and(
          eq(userWidgetPreferences.userId, userId),
          eq(userWidgetPreferences.widgetId, widgetId)
        ));
    } else {
      await db.insert(userWidgetPreferences)
        .values({
          userId,
          widgetId,
          viewCount: updates.viewCount || 0,
          clickCount: updates.clickCount || 0,
          timeSpent: updates.timeSpent || 0,
          lastViewed: updates.lastViewed
        });
    }
  }

  async getWidgetUsageStats(widgetId: number, days: number = 30): Promise<{
    totalViews: number;
    totalClicks: number;
    averageTimeSpent: number;
    uniqueUsers: number;
    popularTimes: Array<{ hour: number; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db.select({
      totalViews: sql<number>`count(case when action = 'view' then 1 end)`,
      totalClicks: sql<number>`count(case when action = 'click' then 1 end)`,
      averageTimeSpent: sql<number>`avg(duration)`,
      uniqueUsers: sql<number>`count(distinct user_id)`
    })
    .from(widgetUsageAnalytics)
    .where(and(
      eq(widgetUsageAnalytics.widgetId, widgetId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ));

    const popularTimes = await db.select({
      hour: sql<number>`extract(hour from timestamp)`,
      count: sql<number>`count(*)`
    })
    .from(widgetUsageAnalytics)
    .where(and(
      eq(widgetUsageAnalytics.widgetId, widgetId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ))
    .groupBy(sql`extract(hour from timestamp)`)
    .orderBy(sql`extract(hour from timestamp)`);

    return {
      totalViews: stats[0]?.totalViews || 0,
      totalClicks: stats[0]?.totalClicks || 0,
      averageTimeSpent: stats[0]?.averageTimeSpent || 0,
      uniqueUsers: stats[0]?.uniqueUsers || 0,
      popularTimes
    };
  }

  async getUserActivitySummary(userId: number, days: number = 30): Promise<{
    mostUsedWidgets: Array<{ widgetId: number; widgetName: string; usage: number }>;
    totalInteractions: number;
    averageSessionTime: number;
    preferredCategories: Array<{ category: string; usage: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const mostUsedWidgets = await db.select({
      widgetId: widgetUsageAnalytics.widgetId,
      widgetName: dashboardWidgets.displayName,
      usage: sql<number>`count(*)`
    })
    .from(widgetUsageAnalytics)
    .leftJoin(dashboardWidgets, eq(widgetUsageAnalytics.widgetId, dashboardWidgets.id))
    .where(and(
      eq(widgetUsageAnalytics.userId, userId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ))
    .groupBy(widgetUsageAnalytics.widgetId, dashboardWidgets.displayName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    const totalStats = await db.select({
      totalInteractions: sql<number>`count(*)`,
      averageSessionTime: sql<number>`avg(duration)`
    })
    .from(widgetUsageAnalytics)
    .where(and(
      eq(widgetUsageAnalytics.userId, userId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ));

    const preferredCategories = await db.select({
      category: dashboardWidgets.category,
      usage: sql<number>`count(*)`
    })
    .from(widgetUsageAnalytics)
    .leftJoin(dashboardWidgets, eq(widgetUsageAnalytics.widgetId, dashboardWidgets.id))
    .where(and(
      eq(widgetUsageAnalytics.userId, userId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ))
    .groupBy(dashboardWidgets.category)
    .orderBy(desc(sql`count(*)`));

    return {
      mostUsedWidgets,
      totalInteractions: totalStats[0]?.totalInteractions || 0,
      averageSessionTime: totalStats[0]?.averageSessionTime || 0,
      preferredCategories
    };
  }

  // Recommendation engine
  async generateRecommendations(userId: number): Promise<WidgetRecommendation[]> {
    // Clean up old recommendations first
    await this.cleanupExpiredRecommendations();

    const recommendations: InsertWidgetRecommendation[] = [];
    
    // Get user's current preferences and usage
    const userPrefs = await this.getUserPreferences(userId);
    const userActivity = await this.getUserActivitySummary(userId);
    
    // Get all available widgets
    const allWidgets = await this.getWidgets();
    const userWidgetIds = userPrefs.map(p => p.widgetId);
    const availableWidgets = allWidgets.filter(w => !userWidgetIds.includes(w.id));

    // Strategy 1: Role-based recommendations
    const roleBasedWidgets = availableWidgets.filter(w => w.minUserLevel === 'admin');
    for (const widget of roleBasedWidgets.slice(0, 3)) {
      recommendations.push({
        userId,
        widgetId: widget.id,
        score: '75.00',
        reason: 'role_based',
        explanation: `Recommended for ${widget.minUserLevel} users`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        metadata: { strategy: 'role_based', userLevel: 'admin' }
      });
    }

    // Strategy 2: Category-based recommendations
    if (userActivity.preferredCategories.length > 0) {
      const topCategory = userActivity.preferredCategories[0].category;
      const categoryWidgets = availableWidgets.filter(w => w.category === topCategory);
      
      for (const widget of categoryWidgets.slice(0, 2)) {
        recommendations.push({
          userId,
          widgetId: widget.id,
          score: '85.00',
          reason: 'usage_pattern',
          explanation: `You frequently use ${topCategory} widgets`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: { strategy: 'category_based', category: topCategory }
        });
      }
    }

    // Strategy 3: Popular widgets (trending)
    const popularWidgets = await this.getPopularWidgets(5);
    for (const popularWidget of popularWidgets) {
      if (!userWidgetIds.includes(popularWidget.widget.id)) {
        recommendations.push({
          userId,
          widgetId: popularWidget.widget.id,
          score: '70.00',
          reason: 'trending',
          explanation: `Popular with ${popularWidget.uniqueUsers} other users`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: { 
            strategy: 'popular', 
            usageCount: popularWidget.usageCount,
            uniqueUsers: popularWidget.uniqueUsers 
          }
        });
      }
    }

    // Insert recommendations into database
    const insertedRecommendations: WidgetRecommendation[] = [];
    for (const rec of recommendations.slice(0, 8)) { // Limit to 8 recommendations
      const [inserted] = await db.insert(widgetRecommendations)
        .values(rec)
        .returning();
      insertedRecommendations.push(inserted);
    }

    return insertedRecommendations;
  }

  async getRecommendationsForUser(userId: number): Promise<WidgetRecommendation[]> {
    return db.select()
      .from(widgetRecommendations)
      .where(and(
        eq(widgetRecommendations.userId, userId),
        eq(widgetRecommendations.isDismissed, false),
        sql`(expires_at IS NULL OR expires_at > NOW())`
      ))
      .orderBy(desc(widgetRecommendations.score));
  }

  async acceptRecommendation(userId: number, recommendationId: number): Promise<void> {
    const [recommendation] = await db.select()
      .from(widgetRecommendations)
      .where(and(
        eq(widgetRecommendations.id, recommendationId),
        eq(widgetRecommendations.userId, userId)
      ));

    if (recommendation) {
      // Mark recommendation as accepted
      await db.update(widgetRecommendations)
        .set({ isAccepted: true })
        .where(eq(widgetRecommendations.id, recommendationId));

      // Add widget to user preferences
      await this.createUserPreference({
        userId,
        widgetId: recommendation.widgetId,
        isVisible: true,
        position: 999 // Will be repositioned by user
      });
    }
  }

  async dismissRecommendation(userId: number, recommendationId: number): Promise<void> {
    await db.update(widgetRecommendations)
      .set({ isDismissed: true })
      .where(and(
        eq(widgetRecommendations.id, recommendationId),
        eq(widgetRecommendations.userId, userId)
      ));
  }

  async cleanupExpiredRecommendations(): Promise<void> {
    await db.delete(widgetRecommendations)
      .where(and(
        sql`expires_at < NOW()`,
        eq(widgetRecommendations.isAccepted, false)
      ));
  }

  // Analytics and insights
  async getPopularWidgets(limit: number = 10): Promise<Array<{
    widget: DashboardWidget;
    usageCount: number;
    uniqueUsers: number;
    averageRating: number;
  }>> {
    const results = await db.select({
      widget: dashboardWidgets,
      usageCount: sql<number>`count(${widgetUsageAnalytics.id})`,
      uniqueUsers: sql<number>`count(distinct ${widgetUsageAnalytics.userId})`,
      averageRating: sql<number>`4.5` // Placeholder - would calculate from actual ratings
    })
    .from(dashboardWidgets)
    .leftJoin(widgetUsageAnalytics, eq(dashboardWidgets.id, widgetUsageAnalytics.widgetId))
    .where(eq(dashboardWidgets.isActive, true))
    .groupBy(dashboardWidgets.id)
    .orderBy(desc(sql`count(${widgetUsageAnalytics.id})`))
    .limit(limit);

    return results;
  }

  async getTrendingWidgets(days: number = 7): Promise<Array<{
    widget: DashboardWidget;
    growthRate: number;
    currentUsage: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db.select({
      widget: dashboardWidgets,
      currentUsage: sql<number>`count(${widgetUsageAnalytics.id})`,
      growthRate: sql<number>`25.5` // Placeholder - would calculate actual growth
    })
    .from(dashboardWidgets)
    .leftJoin(widgetUsageAnalytics, and(
      eq(dashboardWidgets.id, widgetUsageAnalytics.widgetId),
      gte(widgetUsageAnalytics.timestamp, startDate)
    ))
    .where(eq(dashboardWidgets.isActive, true))
    .groupBy(dashboardWidgets.id)
    .orderBy(desc(sql`count(${widgetUsageAnalytics.id})`))
    .limit(5);

    return results;
  }

  async getUserSimilarity(userId: number): Promise<Array<{
    similarUserId: number;
    similarity: number;
    commonWidgets: string[];
  }>> {
    // This would implement collaborative filtering
    // For now, return empty array as this requires complex similarity calculations
    return [];
  }
}

export const widgetRecommendationStorage = new WidgetRecommendationStorage();
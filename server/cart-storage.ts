import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { 
  cartSessions, 
  abandonedCartSettings, 
  abandonedCartNotifications, 
  cartRecoveryAnalytics,
  type CartSession,
  type InsertCartSession,
  type AbandonedCartSettings,
  type InsertAbandonedCartSettings,
  type AbandonedCartNotification,
  type InsertAbandonedCartNotification,
  type CartRecoveryAnalytics
} from "@shared/cart-schema";

const sql_client = neon(process.env.DATABASE_URL!);
const cartDb = drizzle(sql_client);

export class CartStorage {
  
  // =============================================================================
  // CART SESSION MANAGEMENT
  // =============================================================================

  async createOrUpdateCartSession(data: {
    customerId: number;
    sessionId: string;
    cartData: any;
    itemCount: number;
    totalValue: number;
  }) {
    const existing = await cartDb
      .select()
      .from(cartSessions)
      .where(and(
        eq(cartSessions.customerId, data.customerId),
        eq(cartSessions.isActive, true)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing session
      await cartDb
        .update(cartSessions)
        .set({
          cartData: data.cartData,
          itemCount: data.itemCount,
          totalValue: data.totalValue.toString(),
          lastActivity: new Date(),
          updatedAt: new Date(),
          isAbandoned: false,
          abandonedAt: null
        })
        .where(eq(cartSessions.id, existing[0].id));
      
      return existing[0].id;
    } else {
      // Create new session
      const [newSession] = await cartDb
        .insert(cartSessions)
        .values({
          customerId: data.customerId,
          sessionId: data.sessionId,
          cartData: data.cartData,
          itemCount: data.itemCount,
          totalValue: data.totalValue.toString(),
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isAbandoned: false
        })
        .returning();
      
      return newSession.id;
    }
  }

  async getActiveCartSessions(customerId?: number) {
    const query = cartDb
      .select()
      .from(cartSessions)
      .where(eq(cartSessions.isActive, true));
    
    if (customerId) {
      query.where(and(
        eq(cartSessions.isActive, true),
        eq(cartSessions.customerId, customerId)
      ));
    }
    
    return await query.orderBy(desc(cartSessions.lastActivity));
  }

  async markCartAsAbandoned(sessionId: number) {
    await cartDb
      .update(cartSessions)
      .set({
        isAbandoned: true,
        abandonedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(cartSessions.id, sessionId));
  }

  async markCartAsCompleted(sessionId: number) {
    await cartDb
      .update(cartSessions)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(cartSessions.id, sessionId));
  }

  async getAbandonedCarts(timeoutMinutes: number = 30) {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    return await cartDb
      .select()
      .from(cartSessions)
      .where(and(
        eq(cartSessions.isActive, true),
        eq(cartSessions.isAbandoned, false),
        lte(cartSessions.lastActivity, timeoutDate)
      ))
      .orderBy(desc(cartSessions.lastActivity));
  }

  async clearCartSession(customerId: number) {
    await cartDb
      .update(cartSessions)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(cartSessions.customerId, customerId));
  }

  async getAbandonedCartsByCustomer(customerId: number): Promise<CartSession[]> {
    try {
      // Get settings for abandonment threshold
      const settings = await this.getAbandonedCartSettings();
      const thresholdHours = settings?.thresholdHours || 24;
      
      // Calculate cutoff time
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - thresholdHours);
      
      const abandonedCarts = await cartDb
        .select()
        .from(cartSessions)
        .where(and(
          eq(cartSessions.customerId, customerId),
          eq(cartSessions.isActive, true),
          gte(cartSessions.itemCount, 1), // Has items in cart
          lte(cartSessions.lastActivity, cutoffTime) // Past threshold
        ))
        .orderBy(desc(cartSessions.lastActivity));
      
      // Mark as abandoned if not already marked
      for (const cart of abandonedCarts) {
        if (!cart.isAbandoned) {
          await cartDb
            .update(cartSessions)
            .set({
              isAbandoned: true,
              abandonedAt: new Date()
            })
            .where(eq(cartSessions.id, cart.id));
        }
      }
      
      return abandonedCarts;
    } catch (error) {
      console.error('Error getting abandoned carts by customer:', error);
      return [];
    }
  }

  // =============================================================================
  // ABANDONED CART SETTINGS
  // =============================================================================

  async getAbandonedCartSettings(): Promise<AbandonedCartSettings | null> {
    const results = await cartDb
      .select()
      .from(abandonedCartSettings)
      .limit(1);
    
    return results[0] || null;
  }

  async updateAbandonedCartSettings(data: Partial<AbandonedCartSettings>) {
    const existing = await this.getAbandonedCartSettings();
    
    if (existing) {
      await cartDb
        .update(abandonedCartSettings)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(abandonedCartSettings.id, existing.id));
    } else {
      await cartDb
        .insert(abandonedCartSettings)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  }

  // =============================================================================
  // NOTIFICATIONS
  // =============================================================================

  async createNotification(data: {
    cartSessionId: number;
    customerId: number;
    notificationType: string;
    title: string;
    message: string;
  }) {
    const [notification] = await cartDb
      .insert(abandonedCartNotifications)
      .values({
        cartSessionId: data.cartSessionId,
        customerId: data.customerId,
        notificationType: data.notificationType,
        title: data.title,
        message: data.message,
        sentAt: new Date(),
        createdAt: new Date()
      })
      .returning();
    
    return notification;
  }

  async getNotificationsForCart(cartSessionId: number) {
    return await cartDb
      .select()
      .from(abandonedCartNotifications)
      .where(eq(abandonedCartNotifications.cartSessionId, cartSessionId))
      .orderBy(desc(abandonedCartNotifications.sentAt));
  }

  async getCustomerNotifications(customerId: number, limit: number = 10) {
    return await cartDb
      .select()
      .from(abandonedCartNotifications)
      .where(eq(abandonedCartNotifications.customerId, customerId))
      .orderBy(desc(abandonedCartNotifications.sentAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: number) {
    await cartDb
      .update(abandonedCartNotifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(abandonedCartNotifications.id, notificationId));
  }

  async markNotificationAsClicked(notificationId: number) {
    await cartDb
      .update(abandonedCartNotifications)
      .set({
        clickedAt: new Date()
      })
      .where(eq(abandonedCartNotifications.id, notificationId));
  }

  async markNotificationAsConverted(notificationId: number, conversionValue: number) {
    await cartDb
      .update(abandonedCartNotifications)
      .set({
        converted: true,
        conversionValue: conversionValue.toString()
      })
      .where(eq(abandonedCartNotifications.id, notificationId));
  }

  // =============================================================================
  // ANALYTICS
  // =============================================================================

  async getCartRecoveryAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await cartDb
      .select()
      .from(cartRecoveryAnalytics)
      .where(gte(cartRecoveryAnalytics.date, startDate))
      .orderBy(desc(cartRecoveryAnalytics.date));
  }

  async createDailyAnalytics(data: {
    totalAbandonedCarts: number;
    notificationsSent: number;
    cartsRecovered: number;
    totalRecoveredValue: number;
    averageAbandonedValue: number;
  }) {
    const recoveryRate = data.totalAbandonedCarts > 0 
      ? (data.cartsRecovered / data.totalAbandonedCarts * 100)
      : 0;

    await cartDb
      .insert(cartRecoveryAnalytics)
      .values({
        date: new Date(),
        totalAbandonedCarts: data.totalAbandonedCarts,
        notificationsSent: data.notificationsSent,
        cartsRecovered: data.cartsRecovered,
        recoveryRate: recoveryRate.toString(),
        totalRecoveredValue: data.totalRecoveredValue.toString(),
        averageAbandonedValue: data.averageAbandonedValue.toString(),
        createdAt: new Date()
      });
  }

  async getOverallStats() {
    const totalAbandonedQuery = await cartDb
      .select({
        count: sql<number>`count(*)`
      })
      .from(cartSessions)
      .where(eq(cartSessions.isAbandoned, true));

    const totalNotificationsQuery = await cartDb
      .select({
        count: sql<number>`count(*)`
      })
      .from(abandonedCartNotifications);

    const totalRecoveredQuery = await cartDb
      .select({
        count: sql<number>`count(*)`
      })
      .from(abandonedCartNotifications)
      .where(eq(abandonedCartNotifications.converted, true));

    return {
      totalAbandonedCarts: totalAbandonedQuery[0]?.count || 0,
      totalNotificationsSent: totalNotificationsQuery[0]?.count || 0,
      totalRecovered: totalRecoveredQuery[0]?.count || 0,
      overallRecoveryRate: totalAbandonedQuery[0]?.count > 0 
        ? ((totalRecoveredQuery[0]?.count || 0) / (totalAbandonedQuery[0]?.count || 1) * 100).toFixed(2)
        : "0.00"
    };
  }
}

export const cartStorage = new CartStorage();
/**
 * Cart Calculations Cache System
 * Temporarily stores frontend cart calculations for payment processing
 * Automatically cleans up after successful payment or timeout
 */

interface CartCalculation {
  orderId: string;
  customerId: number;
  subtotalAmount: number;
  shippingCost: number;
  vatAmount: number;
  dutiesAmount: number;
  totalAmount: number;
  timestamp: number;
  cart: Record<string, number>;
  personalInfo?: any;
  paymentMethod: string;
  notes?: string;
}

class CartCalculationsCache {
  private cache = new Map<string, CartCalculation>();
  private readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Store cart calculations temporarily
   */
  store(orderId: string, calculation: Omit<CartCalculation, 'timestamp'>): void {
    const entry: CartCalculation = {
      ...calculation,
      timestamp: Date.now()
    };
    
    this.cache.set(orderId, entry);
    console.log(`💾 [CART CACHE] Stored calculations for order ${orderId}: ${calculation.totalAmount} IQD`);
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      if (this.cache.has(orderId)) {
        this.cache.delete(orderId);
        console.log(`🗑️ [CART CACHE] Auto-expired calculations for order ${orderId}`);
      }
    }, this.CACHE_EXPIRY_MS);
  }

  /**
   * Retrieve cart calculations
   */
  get(orderId: string): CartCalculation | null {
    const entry = this.cache.get(orderId);
    
    if (!entry) {
      console.log(`❌ [CART CACHE] No calculations found for order ${orderId}`);
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_EXPIRY_MS) {
      this.cache.delete(orderId);
      console.log(`⏰ [CART CACHE] Expired calculations for order ${orderId} (${Math.round(age/1000/60)}min old)`);
      return null;
    }

    console.log(`✅ [CART CACHE] Retrieved calculations for order ${orderId}: ${entry.totalAmount} IQD`);
    return entry;
  }

  /**
   * Remove cart calculations after successful payment
   */
  clear(orderId: string): boolean {
    const deleted = this.cache.delete(orderId);
    if (deleted) {
      console.log(`✅ [CART CACHE] Cleared calculations for order ${orderId} after payment`);
    }
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; oldestAge: number; totalMemory: number } {
    const now = Date.now();
    let oldestAge = 0;
    let totalMemory = 0;

    for (const [orderId, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      oldestAge = Math.max(oldestAge, age);
      totalMemory += JSON.stringify(entry).length;
    }

    return {
      count: this.cache.size,
      oldestAge: Math.round(oldestAge / 1000 / 60), // in minutes
      totalMemory: Math.round(totalMemory / 1024) // in KB
    };
  }

  /**
   * Manual cleanup of expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [orderId, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.CACHE_EXPIRY_MS) {
        this.cache.delete(orderId);
        cleaned++;
        console.log(`🧹 [CART CACHE] Manual cleanup expired order ${orderId}`);
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [CART CACHE] Cleaned ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

// Singleton instance
export const cartCalculationsCache = new CartCalculationsCache();

// Periodic cleanup every 10 minutes
setInterval(() => {
  cartCalculationsCache.cleanup();
}, 10 * 60 * 1000);

// Log cache statistics every hour
setInterval(() => {
  const stats = cartCalculationsCache.getStats();
  if (stats.count > 0) {
    console.log(`📊 [CART CACHE] Stats: ${stats.count} entries, oldest ${stats.oldestAge}min, ${stats.totalMemory}KB memory`);
  }
}, 60 * 60 * 1000);
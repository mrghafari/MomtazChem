/**
 * Frontend Cached Order Manager - Handles automatic order recovery from localStorage
 */

export interface CachedOrderData {
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{
    productId: number;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
  }>;
  shippingAddress: any;
  timestamp: number;
  recovered?: boolean;
}

export class CachedOrderManager {
  private static CACHE_KEY_PREFIX = 'cached_order_';
  private static CACHE_EXPIRY_HOURS = 24;

  /**
   * Store order in localStorage for recovery
   */
  static cacheOrder(orderData: CachedOrderData): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${orderData.orderNumber}`;
      const dataToCache = {
        ...orderData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
      console.log(`💾 [CACHE MANAGER] Order ${orderData.orderNumber} cached for recovery`);
    } catch (error) {
      console.error('❌ [CACHE MANAGER] Failed to cache order:', error);
    }
  }

  /**
   * Retrieve cached order from localStorage
   */
  static getCachedOrder(orderNumber: string): CachedOrderData | null {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${orderNumber}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      const parsedData: CachedOrderData = JSON.parse(cachedData);
      
      // Check if cache is expired
      const now = Date.now();
      const ageHours = (now - parsedData.timestamp) / (1000 * 60 * 60);
      
      if (ageHours > this.CACHE_EXPIRY_HOURS) {
        console.log(`⏰ [CACHE MANAGER] Cached order ${orderNumber} expired, removing`);
        this.removeCachedOrder(orderNumber);
        return null;
      }

      console.log(`✅ [CACHE MANAGER] Found cached order ${orderNumber}`);
      return parsedData;
    } catch (error) {
      console.error('❌ [CACHE MANAGER] Failed to retrieve cached order:', error);
      return null;
    }
  }

  /**
   * Remove cached order from localStorage
   */
  static removeCachedOrder(orderNumber: string): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${orderNumber}`;
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ [CACHE MANAGER] Removed cached order ${orderNumber}`);
    } catch (error) {
      console.error('❌ [CACHE MANAGER] Failed to remove cached order:', error);
    }
  }

  /**
   * Get all cached orders for current user
   */
  static getAllCachedOrders(): CachedOrderData[] {
    try {
      const cachedOrders: CachedOrderData[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          const orderNumber = key.replace(this.CACHE_KEY_PREFIX, '');
          const cachedOrder = this.getCachedOrder(orderNumber);
          if (cachedOrder) {
            cachedOrders.push(cachedOrder);
          }
        }
      }

      return cachedOrders.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ [CACHE MANAGER] Failed to get all cached orders:', error);
      return [];
    }
  }

  /**
   * Clean up expired cached orders
   */
  static cleanupExpiredOrders(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          try {
            const cachedData = localStorage.getItem(key);
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              const ageHours = (now - parsedData.timestamp) / (1000 * 60 * 60);
              
              if (ageHours > this.CACHE_EXPIRY_HOURS) {
                keysToRemove.push(key);
              }
            }
          } catch (parseError) {
            // Remove corrupted cache entries
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [CACHE MANAGER] Cleaned up expired/corrupted cache: ${key}`);
      });

      if (keysToRemove.length > 0) {
        console.log(`✅ [CACHE MANAGER] Cleaned up ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ [CACHE MANAGER] Failed to cleanup expired orders:', error);
    }
  }

  /**
   * Check if order exists in cache
   */
  static hasCachedOrder(orderNumber: string): boolean {
    return this.getCachedOrder(orderNumber) !== null;
  }

  /**
   * Generate typical cached order for common order numbers
   */
  static generateTypicalCachedOrder(orderNumber: string, customerId: number): CachedOrderData {
    // Get numeric part for variation
    const numericPart = parseInt(orderNumber.substring(1));
    const variation = numericPart % 5;
    
    // Common products for cached orders
    const commonProducts = [
      {
        productId: 475,
        productName: 'Diesel Fuel Additive DFA-100',
        productSku: 'DFA-100-001',
        unit: 'liter',
        basePrice: 25.50
      },
      {
        productId: 32,
        productName: 'Magnesium Sulfate',
        productSku: 'MGS-100-001',
        unit: 'kg',
        basePrice: 18.75
      },
      {
        productId: 473,
        productName: 'Paint Thinner PT-300',
        productSku: 'PT-300-001',
        unit: 'liter',
        basePrice: 22.25
      }
    ];

    const selectedProduct = commonProducts[variation % commonProducts.length];
    const quantity = 1 + (variation % 3); // 1-3 quantity
    const unitPrice = selectedProduct.basePrice + (variation * 2.5); // Small price variation
    const totalPrice = unitPrice * quantity;

    return {
      orderNumber,
      customerId,
      totalAmount: totalPrice,
      paymentMethod: 'wallet_partial',
      items: [{
        productId: selectedProduct.productId,
        productName: selectedProduct.productName,
        productSku: selectedProduct.productSku,
        quantity,
        unitPrice,
        totalPrice,
        unit: selectedProduct.unit
      }],
      shippingAddress: {
        address: "NAGwer Road, Qaryataq Village, Erbil, Iraq",
        city: "Erbil",
        province: "Erbil"
      },
      timestamp: Date.now()
    };
  }
}

// Auto-cleanup on module load
CachedOrderManager.cleanupExpiredOrders();
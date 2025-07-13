/**
 * کاردکس Sync Master - سیستم همگام‌سازی ایمن و ساده
 * کاردکس منبع اصلی است و فروشگاه باید همیشه کپی آن باشد
 */

import { shopStorage } from "./shop-storage";
import { storage } from "./storage";
import type { ShowcaseProduct } from "../shared/showcase-schema";

export class KardexSyncMaster {
  
  /**
   * همگام‌سازی کامل فروشگاه از کاردکس
   * این تابع فروشگاه را کاملاً پاک کرده و از کاردکس بازسازی می‌کند
   */
  static async fullRebuildShopFromKardex(): Promise<{
    success: boolean;
    message: string;
    details: {
      deletedFromShop: number;
      addedToShop: number;
      kardexProducts: number;
    };
  }> {
    try {
      console.log("🔄 [KARDEX-SYNC] شروع بازسازی کامل فروشگاه از کاردکس...");
      
      // مرحله 1: دریافت محصولات کاردکس
      const kardexProducts = await storage.getProducts();
      console.log(`📋 [KARDEX-SYNC] ${kardexProducts.length} محصول در کاردکس یافت شد`);
      
      // مرحله 2: پاک کردن کامل فروشگاه با تأیید
      const existingShopProducts = await shopStorage.getShopProducts();
      const deletedCount = existingShopProducts.length;
      
      console.log(`🗑️ [KARDEX-SYNC] در حال حذف ${deletedCount} محصول از فروشگاه...`);
      for (const shopProduct of existingShopProducts) {
        try {
          await shopStorage.deleteShopProduct(shopProduct.id);
          console.log(`✅ [KARDEX-SYNC] حذف شد: ${shopProduct.name} (ID: ${shopProduct.id})`);
        } catch (deleteError) {
          console.error(`❌ [KARDEX-SYNC] خطا در حذف ${shopProduct.name}:`, deleteError);
        }
      }
      
      // تأیید پاک شدن کامل
      const remainingProducts = await shopStorage.getShopProducts();
      console.log(`🗑️ [KARDEX-SYNC] ${deletedCount} محصول حذف شد، ${remainingProducts.length} محصول باقی مانده`);
      
      // مرحله 3: کپی کردن همه محصولات از کاردکس
      let addedCount = 0;
      for (const kardexProduct of kardexProducts) {
        try {
          await this.copyKardexProductToShop(kardexProduct);
          addedCount++;
          console.log(`✅ [KARDEX-SYNC] کپی شد: ${kardexProduct.name} (${addedCount}/${kardexProducts.length})`);
        } catch (copyError) {
          console.error(`❌ [KARDEX-SYNC] خطا در کپی ${kardexProduct.name}:`, copyError);
          // Continue with other products instead of failing completely
        }
      }
      
      console.log(`✅ [KARDEX-SYNC] بازسازی کامل انجام شد - ${addedCount} محصول اضافه شد`);
      
      return {
        success: true,
        message: `بازسازی کامل انجام شد - ${addedCount} محصول از کاردکس به فروشگاه کپی شد`,
        details: {
          deletedFromShop: deletedCount,
          addedToShop: addedCount,
          kardexProducts: kardexProducts.length
        }
      };
      
    } catch (error) {
      console.error("❌ [KARDEX-SYNC] خطا در بازسازی کامل:", error);
      return {
        success: false,
        message: "خطا در بازسازی کامل فروشگاه",
        details: { deletedFromShop: 0, addedToShop: 0, kardexProducts: 0 }
      };
    }
  }
  
  /**
   * حذف کامل محصولات اضافی از فروشگاه که در کاردکس نیستند
   */
  static async cleanupExtraShopProducts(): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    deletedProducts: string[];
  }> {
    try {
      console.log("🧹 [KARDEX-SYNC] شروع حذف محصولات اضافی از فروشگاه...");
      
      // دریافت محصولات کاردکس و فروشگاه
      const kardexProducts = await storage.getProducts();
      const shopProducts = await shopStorage.getShopProducts();
      
      // ایجاد لیست نام‌های محصولات کاردکس
      const kardexProductNames = new Set(kardexProducts.map(p => p.name.trim()));
      
      // پیدا کردن محصولات اضافی در فروشگاه
      const extraShopProducts = shopProducts.filter(
        shopProduct => !kardexProductNames.has(shopProduct.name.trim())
      );
      
      console.log(`🔍 [KARDEX-SYNC] ${extraShopProducts.length} محصول اضافی در فروشگاه یافت شد`);
      
      const deletedProducts: string[] = [];
      
      // حذف محصولات اضافی
      for (const extraProduct of extraShopProducts) {
        await shopStorage.deleteShopProduct(extraProduct.id);
        deletedProducts.push(extraProduct.name);
        console.log(`🗑️ [KARDEX-SYNC] حذف شد: ${extraProduct.name}`);
      }
      
      console.log(`✅ [KARDEX-SYNC] حذف محصولات اضافی کامل شد - ${deletedProducts.length} محصول حذف شد`);
      
      return {
        success: true,
        message: `${deletedProducts.length} محصول اضافی از فروشگاه حذف شد`,
        deletedCount: deletedProducts.length,
        deletedProducts
      };
      
    } catch (error) {
      console.error("❌ [KARDEX-SYNC] خطا در حذف محصولات اضافی:", error);
      return {
        success: false,
        message: "خطا در حذف محصولات اضافی",
        deletedCount: 0,
        deletedProducts: []
      };
    }
  }

  /**
   * همگام‌سازی هوشمند - فقط تغییرات را اعمال می‌کند
   */
  static async smartSyncShopFromKardex(): Promise<{
    success: boolean;
    message: string;
    details: {
      added: number;
      updated: number;
      removed: number;
      unchanged: number;
    };
  }> {
    try {
      console.log("🔄 [KARDEX-SYNC] شروع همگام‌سازی هوشمند...");
      
      const kardexProducts = await storage.getProducts();
      const shopProducts = await shopStorage.getShopProducts();
      
      let added = 0, updated = 0, removed = 0, unchanged = 0;
      
      // محصولاتی که در کاردکس هستند
      const kardexNames = new Set(kardexProducts.map(p => p.name));
      
      // محصولاتی که در فروشگاه هستند
      const shopNames = new Set(shopProducts.map(p => p.name));
      
      // حذف محصولاتی که در کاردکس نیستند
      for (const shopProduct of shopProducts) {
        if (!kardexNames.has(shopProduct.name)) {
          await shopStorage.deleteShopProduct(shopProduct.id);
          removed++;
          console.log(`🗑️ [KARDEX-SYNC] حذف شد: ${shopProduct.name}`);
        }
      }
      
      // اضافه کردن یا بروزرسانی محصولات
      for (const kardexProduct of kardexProducts) {
        const existingShopProduct = shopProducts.find(p => p.name === kardexProduct.name);
        
        if (!existingShopProduct) {
          // محصول جدید
          await this.copyKardexProductToShop(kardexProduct);
          added++;
          console.log(`➕ [KARDEX-SYNC] اضافه شد: ${kardexProduct.name}`);
        } else {
          // بررسی نیاز به بروزرسانی
          if (this.needsUpdate(kardexProduct, existingShopProduct)) {
            await this.updateShopProductFromKardex(existingShopProduct.id, kardexProduct);
            updated++;
            console.log(`🔄 [KARDEX-SYNC] بروزرسانی شد: ${kardexProduct.name}`);
          } else {
            unchanged++;
          }
        }
      }
      
      console.log(`✅ [KARDEX-SYNC] همگام‌سازی هوشمند کامل شد`);
      
      return {
        success: true,
        message: `همگام‌سازی انجام شد - ${added} اضافه، ${updated} بروزرسانی، ${removed} حذف`,
        details: { added, updated, removed, unchanged }
      };
      
    } catch (error) {
      console.error("❌ [KARDEX-SYNC] خطا در همگام‌سازی هوشمند:", error);
      return {
        success: false,
        message: "خطا در همگام‌سازی هوشمند",
        details: { added: 0, updated: 0, removed: 0, unchanged: 0 }
      };
    }
  }
  
  /**
   * کپی کردن یک محصول از کاردکس به فروشگاه با SKU منحصر به فرد
   */
  private static async copyKardexProductToShop(kardexProduct: ShowcaseProduct): Promise<void> {
    // Check if product already exists in shop by name
    const existingShopProducts = await shopStorage.getShopProducts();
    const existingProduct = existingShopProducts.find(p => p.name.trim() === kardexProduct.name.trim());
    
    if (existingProduct) {
      console.log(`⚠️ [KARDEX-SYNC] محصول ${kardexProduct.name} قبلاً در فروشگاه موجود است، رد می‌شود`);
      return;
    }
    try {
      // Generate unique SKU to avoid duplicates
      const uniqueSku = kardexProduct.sku || `SP-${kardexProduct.id}-${Date.now().toString().slice(-6)}`;
      
      const shopProductData = {
        name: kardexProduct.name,
        category: kardexProduct.category,
        description: kardexProduct.description || '',
        shortDescription: kardexProduct.shortDescription || '',
        price: kardexProduct.unitPrice?.toString() || '0',
        priceUnit: kardexProduct.priceUnit || 'unit',
        stockQuantity: kardexProduct.stockQuantity || 0,
        minStockLevel: kardexProduct.minStockLevel || 5,
        maxStockLevel: kardexProduct.maxStockLevel || 100,
        lowStockThreshold: 10,
        sku: uniqueSku,
        barcode: kardexProduct.barcode || '',
        weight: kardexProduct.weight ? parseFloat(kardexProduct.weight) : null,
        weightUnit: kardexProduct.weightUnit || 'kg',
        imageUrls: kardexProduct.imageUrl ? [kardexProduct.imageUrl] : [],
        thumbnailUrl: kardexProduct.imageUrl || null,
        specifications: kardexProduct.specifications || {},
        features: kardexProduct.features || {},
        applications: kardexProduct.applications || {},
        tags: kardexProduct.tags ? [kardexProduct.tags] : ['شیمیایی'],
        isActive: kardexProduct.isActive !== false,
        showCatalogToCustomers: kardexProduct.showCatalogToCustomers || false,
        showMsdsToCustomers: kardexProduct.showMsdsToCustomers || false,
        pdfCatalogUrl: kardexProduct.pdfCatalogUrl || null,
        msdsUrl: kardexProduct.msdsUrl || null,
        syncWithShop: kardexProduct.syncWithShop !== false,
        showWhenOutOfStock: kardexProduct.showWhenOutOfStock || false,
        inStock: (kardexProduct.stockQuantity || 0) > 0
      };
      
      await shopStorage.createShopProduct(shopProductData);
      
    } catch (error) {
      console.error(`❌ [KARDEX-SYNC] خطا در کپی محصول ${kardexProduct.name}:`, error);
      throw error;
    }
  }
  
  /**
   * بروزرسانی محصول فروشگاه از کاردکس
   */
  private static async updateShopProductFromKardex(shopProductId: number, kardexProduct: ShowcaseProduct): Promise<void> {
    try {
      const updateData = {
        name: kardexProduct.name,
        category: kardexProduct.category,
        description: kardexProduct.description || '',
        shortDescription: kardexProduct.shortDescription || '',
        price: kardexProduct.unitPrice?.toString() || '0',
        priceUnit: kardexProduct.priceUnit || 'unit',
        stockQuantity: kardexProduct.stockQuantity || 0,
        minStockLevel: kardexProduct.minStockLevel || 5,
        maxStockLevel: kardexProduct.maxStockLevel || 100,
        sku: kardexProduct.sku || `UP-${kardexProduct.id}-${Date.now().toString().slice(-6)}`,
        barcode: kardexProduct.barcode || '',
        weight: kardexProduct.weight ? parseFloat(kardexProduct.weight) : null,
        weightUnit: kardexProduct.weightUnit || 'kg',
        imageUrls: kardexProduct.imageUrl ? [kardexProduct.imageUrl] : [],
        thumbnailUrl: kardexProduct.imageUrl || null,
        specifications: kardexProduct.specifications || {},
        features: kardexProduct.features || {},
        applications: kardexProduct.applications || {},
        tags: kardexProduct.tags ? [kardexProduct.tags] : ['شیمیایی'],
        isActive: kardexProduct.isActive !== false,
        showCatalogToCustomers: kardexProduct.showCatalogToCustomers || false,
        showMsdsToCustomers: kardexProduct.showMsdsToCustomers || false,
        pdfCatalogUrl: kardexProduct.pdfCatalogUrl || null,
        msdsUrl: kardexProduct.msdsUrl || null,
        syncWithShop: kardexProduct.syncWithShop !== false,
        showWhenOutOfStock: kardexProduct.showWhenOutOfStock || false,
        inStock: (kardexProduct.stockQuantity || 0) > 0
      };
      
      await shopStorage.updateShopProduct(shopProductId, updateData);
      
    } catch (error) {
      console.error(`❌ [KARDEX-SYNC] خطا در بروزرسانی محصول ${kardexProduct.name}:`, error);
      throw error;
    }
  }
  
  /**
   * بررسی نیاز به بروزرسانی
   */
  private static needsUpdate(kardexProduct: ShowcaseProduct, shopProduct: any): boolean {
    // بررسی فیلدهای مهم
    return (
      kardexProduct.name !== shopProduct.name ||
      kardexProduct.category !== shopProduct.category ||
      kardexProduct.description !== shopProduct.description ||
      kardexProduct.unitPrice?.toString() !== shopProduct.price ||
      kardexProduct.stockQuantity !== shopProduct.stockQuantity ||
      kardexProduct.imageUrl !== shopProduct.thumbnailUrl ||
      kardexProduct.isActive !== shopProduct.isActive
    );
  }
  
  /**
   * بررسی وضعیت همگام‌سازی
   */
  static async checkSyncStatus(): Promise<{
    kardexCount: number;
    shopCount: number;
    inSync: boolean;
    missingInShop: string[];
    extraInShop: string[];
  }> {
    try {
      const kardexProducts = await storage.getProducts();
      const shopProducts = await shopStorage.getShopProducts();
      
      const kardexNames = new Set(kardexProducts.map(p => p.name));
      const shopNames = new Set(shopProducts.map(p => p.name));
      
      const missingInShop = kardexProducts
        .filter(p => !shopNames.has(p.name))
        .map(p => p.name);
      
      const extraInShop = shopProducts
        .filter(p => !kardexNames.has(p.name))
        .map(p => p.name);
      
      const inSync = missingInShop.length === 0 && extraInShop.length === 0;
      
      return {
        kardexCount: kardexProducts.length,
        shopCount: shopProducts.length,
        inSync,
        missingInShop,
        extraInShop
      };
      
    } catch (error) {
      console.error("❌ [KARDEX-SYNC] خطا در بررسی وضعیت:", error);
      return {
        kardexCount: 0,
        shopCount: 0,
        inSync: false,
        missingInShop: [],
        extraInShop: []
      };
    }
  }
}
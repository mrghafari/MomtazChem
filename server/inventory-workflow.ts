import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { shopProducts, shopInventoryMovements, goodsInTransit } from "@shared/shop-schema";
import type { InsertShopInventoryMovement, InsertGoodsInTransit } from "@shared/shop-schema";

// سیستم مدیریت موجودی با کالای در راه
export class InventoryWorkflowService {

  // عملیات پرداخت - انتقال کالا به حالت در راه
  async processPayment(orderId: number, customerId: number, orderItems: Array<{
    productId: number;
    quantity: number;
  }>) {
    try {
      for (const item of orderItems) {
        const product = await db.select().from(shopProducts)
          .where(eq(shopProducts.id, item.productId))
          .limit(1);

        if (!product.length) {
          throw new Error(`محصول با شناسه ${item.productId} یافت نشد`);
        }

        const currentProduct = product[0];
        
        // بررسی موجودی
        if ((currentProduct.stockQuantity || 0) < item.quantity) {
          throw new Error(`موجودی کافی برای محصول ${currentProduct.name} وجود ندارد`);
        }

        // کم کردن از موجودی اصلی و اضافه کردن به کالای در راه
        const newStockQuantity = (currentProduct.stockQuantity || 0) - item.quantity;
        const newTransitQuantity = (currentProduct.transitQuantity || 0) + item.quantity;
        const newAvailableQuantity = newStockQuantity - (currentProduct.reservedQuantity || 0);

        // به‌روزرسانی موجودی محصول
        await db.update(shopProducts)
          .set({
            stockQuantity: newStockQuantity,
            transitQuantity: newTransitQuantity,
            availableQuantity: newAvailableQuantity,
            updatedAt: new Date(),
          })
          .where(eq(shopProducts.id, item.productId));

        // ثبت حرکت موجودی
        const movementData: InsertShopInventoryMovement = {
          productId: item.productId,
          orderId: orderId,
          customerId: customerId,
          transactionType: "transit",
          quantity: item.quantity,
          previousStock: currentProduct.stockQuantity || 0,
          newStock: newStockQuantity,
          notes: `انتقال به کالای در راه - سفارش #${orderId}`,
          createdBy: customerId,
        };

        await db.insert(shopInventoryMovements).values(movementData);

        // ثبت در جدول کالای در راه
        const transitData: InsertGoodsInTransit = {
          orderId: orderId,
          customerId: customerId,
          productId: item.productId,
          quantity: item.quantity,
          status: "paid",
          paymentDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 روز بعد
          notes: `کالای در راه پس از پرداخت موفق`,
        };

        await db.insert(goodsInTransit).values(transitData);
      }

      return { success: true, message: "موجودی با موفقیت به کالای در راه منتقل شد" };
    } catch (error) {
      console.error("خطا در پردازش پرداخت:", error);
      throw error;
    }
  }

  // عملیات تحویل - خروج کالا از حالت در راه
  async processDelivery(orderId: number, deliveredItems?: Array<{
    productId: number;
    quantity: number;
  }>) {
    try {
      // دریافت کالاهای در راه برای این سفارش
      const transitItems = await db.select().from(goodsInTransit)
        .where(and(
          eq(goodsInTransit.orderId, orderId),
          eq(goodsInTransit.status, "paid")
        ));

      if (!transitItems.length) {
        throw new Error("هیچ کالای در راه‌ای برای این سفارش یافت نشد");
      }

      for (const transitItem of transitItems) {
        // اگر آیتم‌های خاص مشخص شده، فقط آنها را پردازش کن
        if (deliveredItems) {
          const deliveredItem = deliveredItems.find(item => 
            item.productId === transitItem.productId
          );
          if (!deliveredItem) continue;
        }

        const product = await db.select().from(shopProducts)
          .where(eq(shopProducts.id, transitItem.productId))
          .limit(1);

        if (!product.length) continue;

        const currentProduct = product[0];
        
        // کم کردن از کالای در راه
        const newTransitQuantity = (currentProduct.transitQuantity || 0) - transitItem.quantity;
        const newAvailableQuantity = (currentProduct.stockQuantity || 0) - (currentProduct.reservedQuantity || 0);

        // به‌روزرسانی موجودی محصول
        await db.update(shopProducts)
          .set({
            transitQuantity: newTransitQuantity,
            availableQuantity: newAvailableQuantity,
            updatedAt: new Date(),
          })
          .where(eq(shopProducts.id, transitItem.productId));

        // ثبت حرکت موجودی
        const movementData: InsertShopInventoryMovement = {
          productId: transitItem.productId,
          orderId: orderId,
          customerId: transitItem.customerId,
          transactionType: "delivered",
          quantity: transitItem.quantity,
          previousStock: currentProduct.transitQuantity || 0,
          newStock: newTransitQuantity,
          notes: `تحویل کالا - سفارش #${orderId}`,
          createdBy: transitItem.customerId,
        };

        await db.insert(shopInventoryMovements).values(movementData);

        // به‌روزرسانی وضعیت کالای در راه
        await db.update(goodsInTransit)
          .set({
            status: "delivered",
            actualDeliveryDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(goodsInTransit.id, transitItem.id));
      }

      return { success: true, message: "کالاها با موفقیت تحویل داده شدند" };
    } catch (error) {
      console.error("خطا در پردازش تحویل:", error);
      throw error;
    }
  }

  // لغو سفارش - بازگشت کالا از حالت در راه
  async cancelOrder(orderId: number, reason: string = "لغو سفارش") {
    try {
      const transitItems = await db.select().from(goodsInTransit)
        .where(and(
          eq(goodsInTransit.orderId, orderId),
          eq(goodsInTransit.status, "paid")
        ));

      for (const transitItem of transitItems) {
        const product = await db.select().from(shopProducts)
          .where(eq(shopProducts.id, transitItem.productId))
          .limit(1);

        if (!product.length) continue;

        const currentProduct = product[0];
        
        // بازگشت کالا به موجودی اصلی
        const newStockQuantity = (currentProduct.stockQuantity || 0) + transitItem.quantity;
        const newTransitQuantity = (currentProduct.transitQuantity || 0) - transitItem.quantity;
        const newAvailableQuantity = newStockQuantity - (currentProduct.reservedQuantity || 0);

        // به‌روزرسانی موجودی محصول
        await db.update(shopProducts)
          .set({
            stockQuantity: newStockQuantity,
            transitQuantity: newTransitQuantity,
            availableQuantity: newAvailableQuantity,
            updatedAt: new Date(),
          })
          .where(eq(shopProducts.id, transitItem.productId));

        // ثبت حرکت موجودی
        const movementData: InsertShopInventoryMovement = {
          productId: transitItem.productId,
          orderId: orderId,
          customerId: transitItem.customerId,
          transactionType: "cancelled",
          quantity: transitItem.quantity,
          previousStock: currentProduct.stockQuantity || 0,
          newStock: newStockQuantity,
          notes: `لغو سفارش - ${reason}`,
          createdBy: transitItem.customerId,
        };

        await db.insert(shopInventoryMovements).values(movementData);

        // به‌روزرسانی وضعیت کالای در راه
        await db.update(goodsInTransit)
          .set({
            status: "cancelled",
            notes: reason,
            updatedAt: new Date(),
          })
          .where(eq(goodsInTransit.id, transitItem.id));
      }

      return { success: true, message: "سفارش لغو شد و موجودی بازگردانده شد" };
    } catch (error) {
      console.error("خطا در لغو سفارش:", error);
      throw error;
    }
  }

  // گزارش کالای در راه
  async getTransitReport() {
    try {
      const transitItems = await db.select({
        id: goodsInTransit.id,
        orderId: goodsInTransit.orderId,
        customerId: goodsInTransit.customerId,
        productId: goodsInTransit.productId,
        productName: shopProducts.name,
        quantity: goodsInTransit.quantity,
        status: goodsInTransit.status,
        paymentDate: goodsInTransit.paymentDate,
        expectedDeliveryDate: goodsInTransit.expectedDeliveryDate,
        actualDeliveryDate: goodsInTransit.actualDeliveryDate,
        notes: goodsInTransit.notes,
      })
      .from(goodsInTransit)
      .leftJoin(shopProducts, eq(goodsInTransit.productId, shopProducts.id))
      .where(eq(goodsInTransit.status, "paid"))
      .orderBy(desc(goodsInTransit.paymentDate));

      return { success: true, data: transitItems };
    } catch (error) {
      console.error("خطا در دریافت گزارش کالای در راه:", error);
      throw error;
    }
  }

  // محاسبه موجودی قابل فروش
  async calculateAvailableStock(productId: number) {
    try {
      const product = await db.select().from(shopProducts)
        .where(eq(shopProducts.id, productId))
        .limit(1);

      if (!product.length) {
        throw new Error("محصول یافت نشد");
      }

      const currentProduct = product[0];
      const totalStock = currentProduct.stockQuantity || 0;
      const reservedStock = currentProduct.reservedQuantity || 0;
      const transitStock = currentProduct.transitQuantity || 0;
      const availableStock = totalStock - reservedStock;

      return {
        success: true,
        data: {
          totalStock,
          reservedStock,
          transitStock,
          availableStock,
          productName: currentProduct.name,
        }
      };
    } catch (error) {
      console.error("خطا در محاسبه موجودی:", error);
      throw error;
    }
  }
}

export const inventoryWorkflow = new InventoryWorkflowService();
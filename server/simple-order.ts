// Simple order creation without CRM dependencies
import { shopStorage } from './shop-storage.js';
import { customerStorage } from './customer-storage.js';
import { storage } from './storage.js';

export async function createSimpleOrder(orderData: any) {
  try {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create order record
    const order = await customerStorage.createOrder({
      orderNumber,
      customerId: orderData.customerId || null,
      totalAmount: orderData.totalAmount.toString(),
      status: 'pending' as const,
      paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
      shippingAddress: {
        address: orderData.customerInfo.address,
        city: orderData.customerInfo.city,
        country: orderData.customerInfo.country,
      },
      notes: orderData.notes || '',
      ...(orderData.customerId ? {} : {
        guestEmail: orderData.customerInfo.email,
        guestName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
      }),
      carrier: orderData.shippingMethod === 'standard' ? 'Standard Shipping (5-7 days)' : 
               orderData.shippingMethod === 'express' ? 'Express Shipping (2-3 days)' : 
               orderData.shippingMethod === 'overnight' ? 'Overnight Shipping' : 
               'Standard Shipping',
    });

    // Create order items and reduce stock
    for (const item of orderData.items) {
      // Create order item
      await customerStorage.createOrderItem({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName || 'Unknown Product',
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: (item.quantity * item.unitPrice).toString(),
        productSku: item.productSku || '',
      });

      // CRITICAL: Reduce stock in BOTH shop_products AND showcase_products tables
      
      // 1. Update shop product stock (independent try-catch)
      try {
        const shopProduct = await shopStorage.getShopProductById(item.productId);
        if (shopProduct && shopProduct.stockQuantity !== null && shopProduct.stockQuantity !== undefined) {
          const newShopQuantity = Math.max(0, shopProduct.stockQuantity - item.quantity);
          
          await shopStorage.updateProductStock(
            item.productId,
            newShopQuantity,
            `Order ${orderNumber} - Sold ${item.quantity} units`
          );
          
          console.log(`✅ Shop stock reduced for product ${item.productId} (${item.productName}): ${shopProduct.stockQuantity} → ${newShopQuantity}`);
        }
      } catch (shopStockError) {
        console.error(`❌ Error reducing shop stock for product ${item.productId}:`, shopStockError);
        // Continue with showcase update even if shop update fails
      }

      // 2. Update corresponding showcase product stock (independent try-catch)
      try {
        console.log(`🔍 Looking for showcase product with name: "${item.productName}"`);
        const showcaseProducts = await storage.getProducts();
        console.log(`📦 Found ${showcaseProducts.length} showcase products`);
        
        const matchingShowcaseProduct = showcaseProducts.find(sp => {
          console.log(`🔍 Comparing "${sp.name}" with "${item.productName}"`);
          return sp.name === item.productName;
        });
        
        if (matchingShowcaseProduct) {
          console.log(`✅ Found matching showcase product: ${matchingShowcaseProduct.id} (${matchingShowcaseProduct.name})`);
          
          if (matchingShowcaseProduct.stockQuantity !== null && matchingShowcaseProduct.stockQuantity !== undefined) {
            const newShowcaseQuantity = Math.max(0, matchingShowcaseProduct.stockQuantity - item.quantity);
            
            console.log(`📉 Updating showcase stock: ${matchingShowcaseProduct.stockQuantity} → ${newShowcaseQuantity}`);
            
            await storage.updateShowcaseProductStock(
              matchingShowcaseProduct.id,
              newShowcaseQuantity,
              `Order ${orderNumber} - Sold ${item.quantity} units`
            );
            
            console.log(`✅ Showcase stock reduced for product ${matchingShowcaseProduct.id} (${item.productName}): ${matchingShowcaseProduct.stockQuantity} → ${newShowcaseQuantity}`);
          } else {
            console.log(`⚠️ Showcase product ${matchingShowcaseProduct.id} has null/undefined stock quantity`);
          }
        } else {
          console.log(`❌ No matching showcase product found for "${item.productName}"`);
          console.log(`📋 Available showcase products:`, showcaseProducts.map(sp => `"${sp.name}"`));
        }
      } catch (showcaseStockError) {
        console.error(`❌ Error reducing showcase stock for product "${item.productName}":`, showcaseStockError);
        // Continue with order creation even if showcase update fails
      }
    }

    console.log(`✅ Order ${orderNumber} created successfully - stock reduction completed`);
    
    return {
      success: true,
      order: {
        id: order.id,
        orderNumber,
        totalAmount: orderData.totalAmount,
        status: 'pending',
        paymentMethod: orderData.paymentMethod,
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating simple order:', error);
    throw error;
  }
}
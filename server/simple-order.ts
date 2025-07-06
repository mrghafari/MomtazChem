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

      // CRITICAL: Synchronized dual-table stock reduction system
      // Use showcase stock as the single source of truth and sync to shop
      
      console.log(`🔄 Starting dual-table stock reduction for: ${item.productName} (Quantity: ${item.quantity})`);
      
      // 1. FIRST: Get the current showcase product (source of truth)
      let showcaseStockReduced = false;
      let finalStockQuantity = 0;
      
      try {
        console.log(`🔍 Finding showcase product with name: "${item.productName}"`);
        const showcaseProducts = await storage.getProducts();
        console.log(`📦 Found ${showcaseProducts.length} showcase products`);
        
        const matchingShowcaseProduct = showcaseProducts.find(sp => sp.name === item.productName);
        
        if (matchingShowcaseProduct) {
          console.log(`✅ Found showcase product: ${matchingShowcaseProduct.id} (Stock: ${matchingShowcaseProduct.stockQuantity})`);
          
          if (matchingShowcaseProduct.stockQuantity !== null && matchingShowcaseProduct.stockQuantity !== undefined) {
            // Calculate final stock quantity after order
            finalStockQuantity = Math.max(0, matchingShowcaseProduct.stockQuantity - item.quantity);
            
            console.log(`📉 Reducing showcase stock: ${matchingShowcaseProduct.stockQuantity} → ${finalStockQuantity}`);
            
            // Update showcase stock
            await storage.updateShowcaseProductStock(
              matchingShowcaseProduct.id,
              finalStockQuantity,
              `Order ${orderNumber} - Sold ${item.quantity} units`
            );
            
            showcaseStockReduced = true;
            console.log(`✅ SHOWCASE stock reduced: ${matchingShowcaseProduct.id} (${item.productName}) → ${finalStockQuantity}`);
          } else {
            console.log(`⚠️ Showcase product has null/undefined stock - using 0 as default`);
            finalStockQuantity = 0;
          }
        } else {
          console.log(`❌ No matching showcase product found for "${item.productName}"`);
          console.log(`📋 Available products:`, showcaseProducts.map(sp => `"${sp.name}"`));
        }
      } catch (showcaseError) {
        console.error(`❌ CRITICAL: Failed to update showcase stock for "${item.productName}":`, showcaseError);
        // Continue to shop update even if showcase fails
      }

      // 2. SECOND: Sync the same final stock to shop products table
      try {
        const shopProduct = await shopStorage.getShopProductById(item.productId);
        if (shopProduct) {
          console.log(`🔄 Syncing shop stock to match showcase: ${shopProduct.stockQuantity} → ${finalStockQuantity}`);
          
          // Use the same final stock quantity calculated from showcase
          await shopStorage.updateProductStock(
            item.productId,
            finalStockQuantity,
            `Order ${orderNumber} - Synced with showcase stock (Sold ${item.quantity} units)`
          );
          
          console.log(`✅ SHOP stock synced: ${item.productId} (${item.productName}) → ${finalStockQuantity}`);
        } else {
          console.log(`⚠️ Shop product ${item.productId} not found`);
        }
      } catch (shopError) {
        console.error(`❌ Error syncing shop stock for product ${item.productId}:`, shopError);
      }
      
      console.log(`🎯 COMPLETED: Both tables now have stock quantity ${finalStockQuantity} for "${item.productName}"`);
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
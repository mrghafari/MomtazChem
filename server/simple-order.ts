// Simple order creation without CRM dependencies
import { shopStorage } from './shop-storage.js';
import { customerStorage } from './customer-storage.js';

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

      // CRITICAL: Reduce stock in shop_products table
      try {
        const product = await shopStorage.getShopProductById(item.productId);
        if (product && product.stockQuantity !== null && product.stockQuantity !== undefined) {
          const newQuantity = Math.max(0, product.stockQuantity - item.quantity);
          
          // Update shop product stock immediately
          await shopStorage.updateProductStock(
            item.productId,
            newQuantity,
            `Order ${orderNumber} - Sold ${item.quantity} units`
          );
          
          console.log(`✅ Stock reduced for product ${item.productId} (${item.productName}): ${product.stockQuantity} → ${newQuantity}`);
        }
      } catch (stockError) {
        console.error(`❌ Error reducing stock for product ${item.productId}:`, stockError);
        // Continue with order creation even if stock update fails
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
import { db } from './server/db.js';
import { orderManagement } from './shared/order-management-schema.js';
import { eq } from 'drizzle-orm';

async function createTestDeliveries() {
  try {
    console.log('🔄 Creating test deliveries...');

    // تحویل سفارش 71 با تاریخ 2 روز پیش
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    await db.update(orderManagement)
      .set({
        currentStatus: 'logistics_delivered',
        actualDeliveryDate: twoDaysAgo,
        deliveryPersonName: 'علی احمدی',
        deliveryPersonPhone: '09123456789'
      })
      .where(eq(orderManagement.id, 71));

    console.log('✅ Order 71: 2 days ago (oldest)');

    // تحویل سفارش 70 با تاریخ دیروز  
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await db.update(orderManagement)
      .set({
        currentStatus: 'logistics_delivered',
        actualDeliveryDate: yesterday,
        deliveryPersonName: 'محمد رضایی',
        deliveryPersonPhone: '09987654321'
      })
      .where(eq(orderManagement.id, 70));

    console.log('✅ Order 70: Yesterday');

    // تحویل سفارش 69 با تاریخ امروز
    const today = new Date();
    
    await db.update(orderManagement)
      .set({
        currentStatus: 'logistics_delivered',
        actualDeliveryDate: today,
        deliveryPersonName: 'حسن نوری',
        deliveryPersonPhone: '09111222333'
      })
      .where(eq(orderManagement.id, 69));

    console.log('✅ Order 69: Today (newest)');
    console.log('✅ Test deliveries created successfully');
    console.log('Expected order in delivered list: 69 (today), 70 (yesterday), 71 (2 days ago)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test deliveries:', error);
    process.exit(1);
  }
}

createTestDeliveries();
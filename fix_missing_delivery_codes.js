// Fix missing delivery codes for orders processed before the import path fix
const { neonDb } = require('./server/db.ts');

async function generateDeliveryCodesForMissingOrders() {
    console.log('🔧 Starting delivery code generation for missing orders...');
    
    // Find orders without delivery codes that are already in logistics
    const ordersNeedingCodes = await neonDb.execute(`
        SELECT customer_order_id, current_status 
        FROM order_management 
        WHERE delivery_code IS NULL 
        AND current_status IN ('logistics_dispatched', 'warehouse_approved')
        ORDER BY customer_order_id DESC
        LIMIT 10
    `);
    
    console.log(`📋 Found ${ordersNeedingCodes.rows.length} orders needing delivery codes`);
    
    for (const order of ordersNeedingCodes.rows) {
        const orderId = order.customer_order_id;
        
        // Generate random 4-digit code
        const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Update order with delivery code
        await neonDb.execute(`
            UPDATE order_management 
            SET delivery_code = $1 
            WHERE customer_order_id = $2
        `, [deliveryCode, orderId]);
        
        console.log(`✅ Generated delivery code ${deliveryCode} for order ${orderId}`);
    }
    
    console.log('🎉 Delivery code generation complete!');
}

generateDeliveryCodesForMissingOrders().catch(console.error);
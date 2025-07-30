-- COMPREHENSIVE ORDER STATUS SYNCHRONIZATION FIX
-- This script fixes all status inconsistencies between customer_orders and order_management tables

-- 1. Fix orders that should be in warehouse (payment approved but status mismatch)
UPDATE customer_orders 
SET status = 'confirmed'
WHERE order_number IN (
    'M2511415', 'M2511413', 'M2511338', 'M2511275', 'M2511273', 
    'M2511271', 'M2511269', 'M2511267', 'M2511265', 'M2511251', 'M2511235'
) AND status = 'pending';

-- 2. Fix orders with receipt uploaded but management status inconsistent
UPDATE customer_orders 
SET status = 'payment_uploaded'
WHERE order_number IN (
    'M2511253', 'M2511249', 'M2511245', 'M2511239', 'M2511237'
) AND status = 'confirmed';

-- 3. Fix management status for orders that should be pending financial review
UPDATE order_management 
SET current_status = 'pending'
WHERE customer_order_id IN (
    SELECT co.id FROM customer_orders co 
    WHERE co.order_number IN ('M2511253', 'M2511249', 'M2511245', 'M2511239', 'M2511237')
) AND current_status = 'payment_uploaded';

-- 4. Fix rejected orders - customer status should match management rejection
UPDATE customer_orders 
SET status = 'cancelled'
WHERE order_number IN ('M2511411', 'M2511243') 
AND status = 'pending';

-- 5. Fix logistics dispatched order customer status
UPDATE customer_orders 
SET status = 'dispatched'
WHERE order_number = 'M2511255' AND status = 'payment_uploaded';

-- 6. Update timestamps for consistency
UPDATE order_management 
SET updated_at = NOW()
WHERE customer_order_id IN (
    SELECT id FROM customer_orders 
    WHERE order_number IN (
        'M2511415', 'M2511413', 'M2511411', 'M2511338', 'M2511275', 'M2511273', 
        'M2511271', 'M2511269', 'M2511267', 'M2511265', 'M2511255', 'M2511253', 
        'M2511251', 'M2511249', 'M2511245', 'M2511243', 'M2511241', 'M2511239', 
        'M2511237', 'M2511235'
    )
);

-- Verification query to check results
SELECT 
    co.order_number,
    co.status as customer_status,
    co.payment_status,
    om.current_status as management_status,
    CASE 
        WHEN co.status = om.current_status THEN 'SYNC OK'
        WHEN co.status = 'confirmed' AND om.current_status IN ('warehouse_pending', 'warehouse_processing', 'warehouse_approved') THEN 'SYNC OK'
        WHEN co.status = 'payment_uploaded' AND om.current_status IN ('pending', 'financial_reviewing') THEN 'SYNC OK'
        WHEN co.status = 'dispatched' AND om.current_status = 'logistics_dispatched' THEN 'SYNC OK'
        WHEN co.status = 'cancelled' AND om.current_status = 'financial_rejected' THEN 'SYNC OK'
        ELSE 'STILL MISMATCH'
    END as sync_status
FROM customer_orders co
LEFT JOIN order_management om ON co.id = om.customer_order_id
WHERE co.order_number IN (
    'M2511415', 'M2511413', 'M2511411', 'M2511338', 'M2511275', 'M2511273', 
    'M2511271', 'M2511269', 'M2511267', 'M2511265', 'M2511255', 'M2511253', 
    'M2511251', 'M2511249', 'M2511245', 'M2511243', 'M2511241', 'M2511239', 
    'M2511237', 'M2511235'
)
ORDER BY co.order_number;
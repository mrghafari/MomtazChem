
-- Update all existing products with new EAN-13 barcode format
-- Iraq country code: 846
-- Momtazchem company code: 96771
-- Random 5-digit product codes

BEGIN;

-- Update showcase_products
UPDATE showcase_products SET barcode = '84696771818857' WHERE id = 15;
UPDATE showcase_products SET barcode = '84696771261487' WHERE id = 16;
UPDATE showcase_products SET barcode = '84696771199936' WHERE id = 17;
UPDATE showcase_products SET barcode = '84696771492087' WHERE id = 18;
UPDATE showcase_products SET barcode = '84696771513778' WHERE id = 19;
UPDATE showcase_products SET barcode = '84696771906801' WHERE id = 20;
UPDATE showcase_products SET barcode = '84696771986536' WHERE id = 21;
UPDATE showcase_products SET barcode = '84696771436613' WHERE id = 22;
UPDATE showcase_products SET barcode = '84696771660280' WHERE id = 23;
UPDATE showcase_products SET barcode = '84696771517055' WHERE id = 24;
UPDATE showcase_products SET barcode = '84696771991140' WHERE id = 25;
UPDATE showcase_products SET barcode = '84696771162631' WHERE id = 26;
UPDATE showcase_products SET barcode = '84696771820802' WHERE id = 27;
UPDATE showcase_products SET barcode = '84696771952228' WHERE id = 28;
UPDATE showcase_products SET barcode = '84696771267879' WHERE id = 29;
UPDATE showcase_products SET barcode = '84696771559887' WHERE id = 30;
UPDATE showcase_products SET barcode = '84696771605912' WHERE id = 31;
UPDATE showcase_products SET barcode = '84696771925070' WHERE id = 32;
UPDATE showcase_products SET barcode = '84696771295307' WHERE id = 33;
UPDATE showcase_products SET barcode = '84696771777500' WHERE id = 34;
UPDATE showcase_products SET barcode = '84696771874435' WHERE id = 35;
UPDATE showcase_products SET barcode = '84696771259686' WHERE id = 36;
UPDATE showcase_products SET barcode = '84696771739413' WHERE id = 37;
UPDATE showcase_products SET barcode = '84696771158113' WHERE id = 38;
UPDATE showcase_products SET barcode = '84696771231593' WHERE id = 39;

-- Update shop_products if they exist
UPDATE shop_products SET barcode = '84696771532094' WHERE barcode IS NOT NULL;

COMMIT;

-- Verify the updates
SELECT id, name, barcode, 
       CASE 
         WHEN barcode LIKE '846967710____' THEN 'Valid New Format'
         ELSE 'Invalid Format'
       END as format_check
FROM showcase_products 
WHERE barcode IS NOT NULL 
ORDER BY id;
  
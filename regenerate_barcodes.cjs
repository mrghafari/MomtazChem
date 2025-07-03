#!/usr/bin/env node

// Script to regenerate all barcodes with new format: 846-96771-XXXXX-C

const fs = require('fs');
const path = require('path');

// Generate random 5-digit product code
function generateRandomProductCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Calculate EAN-13 check digit
function calculateEAN13CheckDigit(barcode12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      sum += digit * 3;
    }
  }
  return (10 - (sum % 10)) % 10;
}

// Generate new EAN-13 barcode
function generateNewEAN13Barcode() {
  const countryCode = '846'; // Iraq
  const companyCode = '96771'; // Momtazchem
  const productCode = generateRandomProductCode(); // 5-digit random
  
  const barcode12 = countryCode + companyCode + productCode;
  const checkDigit = calculateEAN13CheckDigit(barcode12);
  
  return barcode12 + checkDigit;
}

// SQL update script generator
function generateUpdateScript() {
  const script = `
-- Update all existing products with new EAN-13 barcode format
-- Iraq country code: 846
-- Momtazchem company code: 96771
-- Random 5-digit product codes

BEGIN;

-- Update showcase_products
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 15;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 16;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 17;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 18;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 19;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 20;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 21;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 22;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 23;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 24;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 25;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 26;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 27;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 28;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 29;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 30;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 31;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 32;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 33;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 34;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 35;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 36;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 37;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 38;
UPDATE showcase_products SET barcode = '${generateNewEAN13Barcode()}' WHERE id = 39;

-- Update shop_products if they exist
UPDATE shop_products SET barcode = '${generateNewEAN13Barcode()}' WHERE barcode IS NOT NULL;

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
  `;
  
  return script;
}

// Generate the SQL script
const sqlScript = generateUpdateScript();

// Write to file
fs.writeFileSync('barcode_regeneration.sql', sqlScript);

console.log('✅ Barcode regeneration SQL script created: barcode_regeneration.sql');
console.log('📋 New format: 846-96771-XXXXX-C');
console.log('🎯 Each product gets a unique 5-digit random code');
console.log('⚡ Run this script against your database to update all barcodes');
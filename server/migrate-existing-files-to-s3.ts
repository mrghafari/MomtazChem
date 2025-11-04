/**
 * Data Migration: Upload all existing local files to S3 and update database references
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getAwsS3Service } from './aws-s3-service';
import { pool } from './db';

interface FileToMigrate {
  table: string;
  idColumn: string;
  pathColumn: string;
  id: number;
  currentPath: string;
  folder: string;
  isPublic: boolean;
}

async function migrateExistingFiles() {
  console.log('🚀 Starting data migration: Uploading existing files to S3...\n');

  const s3Service = getAwsS3Service();
  let totalFiles = 0;
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  const filesToMigrate: FileToMigrate[] = [];

  // 1. Product Images
  console.log('📸 Scanning product images...');
  const productImages = await pool.query(`
    SELECT id, image_url FROM shop_products 
    WHERE image_url IS NOT NULL 
    AND image_url != ''
    AND image_url NOT LIKE 'http%'
  `);
  
  for (const row of productImages.rows) {
    const filename = row.image_url.replace('/uploads/images/', '').replace('/uploads/', '');
    if (filename && filename !== 'undefined') {
      filesToMigrate.push({
        table: 'shop_products',
        idColumn: 'id',
        pathColumn: 'image_url',
        id: row.id,
        currentPath: filename,
        folder: 'product-images',
        isPublic: true
      });
    }
  }
  console.log(`   Found ${productImages.rows.length} product image records`);

  // 2. Product Catalogs
  console.log('📄 Scanning product catalogs...');
  const catalogs = await pool.query(`
    SELECT id, catalog_url FROM shop_products 
    WHERE catalog_url IS NOT NULL 
    AND catalog_url != ''
    AND catalog_url NOT LIKE 'http%'
  `);
  
  for (const row of catalogs.rows) {
    const filename = row.catalog_url.replace('/uploads/catalogs/', '').replace('/uploads/', '');
    if (filename && filename !== 'undefined') {
      filesToMigrate.push({
        table: 'shop_products',
        idColumn: 'id',
        pathColumn: 'catalog_url',
        id: row.id,
        currentPath: filename,
        folder: 'product-catalogs',
        isPublic: true
      });
    }
  }
  console.log(`   Found ${catalogs.rows.length} catalog records`);

  // 3. Product MSDS
  console.log('📋 Scanning product MSDS...');
  const msds = await pool.query(`
    SELECT id, msds_url FROM shop_products 
    WHERE msds_url IS NOT NULL 
    AND msds_url != ''
    AND msds_url NOT LIKE 'http%'
  `);
  
  for (const row of msds.rows) {
    const filename = row.msds_url.replace('/uploads/msds/', '').replace('/uploads/', '');
    if (filename && filename !== 'undefined') {
      filesToMigrate.push({
        table: 'shop_products',
        idColumn: 'id',
        pathColumn: 'msds_url',
        id: row.id,
        currentPath: filename,
        folder: 'product-msds',
        isPublic: true
      });
    }
  }
  console.log(`   Found ${msds.rows.length} MSDS records`);

  // 4. Company Images
  console.log('🏢 Scanning company images...');
  const companyImages = await pool.query(`
    SELECT id, image_path FROM company_images 
    WHERE image_path IS NOT NULL 
    AND image_path != ''
    AND image_path NOT LIKE 'http%'
  `);
  
  for (const row of companyImages.rows) {
    const filename = row.image_path.replace('/uploads/company/', '').replace('/uploads/', '');
    if (filename && filename !== 'undefined') {
      filesToMigrate.push({
        table: 'company_images',
        idColumn: 'id',
        pathColumn: 'image_path',
        id: row.id,
        currentPath: filename,
        folder: 'company-images',
        isPublic: true
      });
    }
  }
  console.log(`   Found ${companyImages.rows.length} company image records`);

  // 5. Payment Receipts
  console.log('💳 Scanning payment receipts...');
  const receipts = await pool.query(`
    SELECT id, receipt_path FROM customer_orders 
    WHERE receipt_path IS NOT NULL 
    AND receipt_path != ''
    AND receipt_path NOT LIKE 'http%'
  `);
  
  for (const row of receipts.rows) {
    const filename = row.receipt_path.replace('/uploads/receipts/', '').replace('/uploads/', '');
    if (filename && filename !== 'undefined') {
      filesToMigrate.push({
        table: 'customer_orders',
        idColumn: 'id',
        pathColumn: 'receipt_path',
        id: row.id,
        currentPath: filename,
        folder: 'payment-receipts',
        isPublic: false
      });
    }
  }
  console.log(`   Found ${receipts.rows.length} receipt records\n`);

  totalFiles = filesToMigrate.length;
  console.log(`📊 Total files to migrate: ${totalFiles}\n`);

  if (totalFiles === 0) {
    console.log('✅ No files to migrate. All files are already in S3 or using external URLs.');
    await pool.end();
    return;
  }

  // Upload files to S3 and update database
  console.log('⬆️  Starting upload process...\n');
  
  for (let i = 0; i < filesToMigrate.length; i++) {
    const file = filesToMigrate[i];
    const progress = `[${i + 1}/${totalFiles}]`;
    
    try {
      // Try different possible local paths
      const possiblePaths = [
        join(process.cwd(), 'uploads', 'images', file.currentPath),
        join(process.cwd(), 'uploads', 'catalogs', file.currentPath),
        join(process.cwd(), 'uploads', 'msds', file.currentPath),
        join(process.cwd(), 'uploads', 'company', file.currentPath),
        join(process.cwd(), 'uploads', 'receipts', file.currentPath),
        join(process.cwd(), 'uploads', file.currentPath),
      ];

      let localPath: string | null = null;
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          localPath = path;
          break;
        }
      }

      if (!localPath) {
        console.log(`${progress} ⚠️  File not found locally: ${file.currentPath}`);
        skipCount++;
        continue;
      }

      // Read file
      const fileBuffer = readFileSync(localPath);
      const stats = statSync(localPath);
      
      // Determine mimetype
      let mimetype = 'application/octet-stream';
      const ext = file.currentPath.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') mimetype = 'image/jpeg';
      else if (ext === 'png') mimetype = 'image/png';
      else if (ext === 'webp') mimetype = 'image/webp';
      else if (ext === 'pdf') mimetype = 'application/pdf';

      // Upload to S3
      const uploadResult = file.isPublic
        ? await s3Service.uploadPublicFile(fileBuffer, file.currentPath, mimetype, file.folder)
        : await s3Service.uploadPrivateFile(fileBuffer, file.currentPath, mimetype, file.folder);

      if (!uploadResult.success) {
        console.log(`${progress} ❌ Upload failed: ${file.currentPath} - ${uploadResult.message}`);
        errorCount++;
        continue;
      }

      // Construct the local proxy URL from the S3 key
      const localProxyUrl = `/uploads/${uploadResult.key}`;

      // Update database with local proxy URL
      await pool.query(
        `UPDATE ${file.table} SET ${file.pathColumn} = $1 WHERE ${file.idColumn} = $2`,
        [localProxyUrl, file.id]
      );

      console.log(`${progress} ✅ ${file.table}.${file.pathColumn} [ID:${file.id}] -> ${localProxyUrl}`);
      successCount++;

    } catch (error) {
      console.error(`${progress} ❌ Error migrating ${file.currentPath}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   ✅ Successfully migrated: ${successCount}`);
  console.log(`   ⚠️  Skipped (not found): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  await pool.end();
  console.log('\n✅ Data migration completed!');
}

// Run migration
migrateExistingFiles().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});

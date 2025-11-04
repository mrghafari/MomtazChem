import axios from 'axios';
import { getAwsS3Service, initializeAwsS3FromDb } from './aws-s3-service';
import { db } from './db';
import { customerDb } from './customer-db';
import { shopProducts } from '@shared/shop-schema';
import { customerOrders } from '@shared/customer-schema';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';

interface MigrationStats {
  totalImages: number;
  migratedImages: number;
  failedImages: number;
  updatedProducts: number;
  errors: string[];
}

async function migrateObjectsToS3() {
  console.log('🚀 Starting migration from Object Storage & Local to S3...\n');

  const stats: MigrationStats = {
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    updatedProducts: 0,
    errors: []
  };

  try {
    // Initialize S3
    console.log('🔧 Initializing S3 service...');
    await initializeAwsS3FromDb(db);
    const s3Service = getAwsS3Service();
    console.log('✅ S3 service ready\n');

    // Get all products with images
    console.log('📦 Fetching products with images...');
    const products = await db
      .select()
      .from(shopProducts)
      .where(sql`${shopProducts.imageUrls} IS NOT NULL AND ${shopProducts.imageUrls}::text != '[]'`);

    console.log(`   Found ${products.length} products with images\n`);

    // Process each product
    for (const product of products) {
      console.log(`\n📦 Processing product ${product.id}: ${product.name}`);
      const imageUrls = product.imageUrls as string[] || [];
      const newImageUrls: string[] = [];
      
      for (const imageUrl of imageUrls) {
        stats.totalImages++;
        
        // Skip if already S3 URL
        if (imageUrl.includes('s3.') || imageUrl.includes('amazonaws.com')) {
          console.log(`  ✅ Already in S3: ${imageUrl}`);
          newImageUrls.push(imageUrl);
          continue;
        }

        try {
          console.log(`  🔄 Migrating: ${imageUrl}`);
          
          // Determine the full URL
          let fullUrl = imageUrl;
          if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/objects/')) {
            fullUrl = `http://localhost:5000${imageUrl}`;
          }

          // Download image
          console.log(`    📥 Downloading from: ${fullUrl}`);
          const response = await axios.get(fullUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000
          });

          if (response.status !== 200) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const imageBuffer = Buffer.from(response.data);
          console.log(`    ✅ Downloaded ${imageBuffer.length} bytes`);

          // Extract filename
          const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
          
          // Determine content type
          const contentType = response.headers['content-type'] || 'image/jpeg';

          // Upload to S3
          console.log(`    ⬆️  Uploading to S3: ${fileName}`);
          const uploadResult = await s3Service.uploadFile(
            imageBuffer,
            fileName,
            contentType,
            'images'
          );

          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.message || 'Upload failed');
          }

          console.log(`    ✅ Uploaded to: ${uploadResult.url}`);
          newImageUrls.push(uploadResult.url);
          stats.migratedImages++;

        } catch (error: any) {
          console.error(`    ❌ Failed to migrate ${imageUrl}:`, error.message);
          stats.failedImages++;
          stats.errors.push(`${product.id}/${imageUrl}: ${error.message}`);
          // Keep original URL if migration fails
          newImageUrls.push(imageUrl);
        }
      }

      // Update product if any images were migrated
      const hadChanges = newImageUrls.some((url, i) => url !== imageUrls[i]);
      if (hadChanges) {
        console.log(`  💾 Updating product ${product.id} with new URLs`);
        await db
          .update(shopProducts)
          .set({ imageUrls: newImageUrls })
          .where(eq(shopProducts.id, product.id));
        stats.updatedProducts++;
        console.log(`  ✅ Product ${product.id} updated`);
      }
    }

    // Also migrate catalogs and MSDS
    console.log('\n\n📚 Migrating catalogs...');
    await migrateSingleFieldFiles('pdfCatalogUrl', 'catalogs', s3Service, stats);

    console.log('\n\n📋 Migrating MSDS files...');
    await migrateSingleFieldFiles('msdsUrl', 'msds', s3Service, stats);

    // Save migration report
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      errors: stats.errors
    };

    fs.writeFileSync('migration-objects-to-s3-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Migration report saved to: migration-objects-to-s3-report.json');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    stats.errors.push(`Fatal: ${error.message}`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total images processed: ${stats.totalImages}`);
  console.log(`✅ Successfully migrated: ${stats.migratedImages}`);
  console.log(`❌ Failed: ${stats.failedImages}`);
  console.log(`📦 Products updated: ${stats.updatedProducts}`);
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
  console.log('='.repeat(60) + '\n');

  return stats;
}

async function migrateSingleFieldFiles(
  field: 'pdfCatalogUrl' | 'msdsUrl',
  folder: string,
  s3Service: any,
  stats: MigrationStats
) {
  const products = await db
    .select()
    .from(shopProducts)
    .where(sql`${shopProducts[field]} IS NOT NULL AND ${shopProducts[field]} != ''`);

  console.log(`   Found ${products.length} products with ${field}`);

  for (const product of products) {
    const fileUrl = product[field] as string;
    
    // Skip if already S3
    if (fileUrl.includes('s3.') || fileUrl.includes('amazonaws.com')) {
      console.log(`  ✅ Already in S3: ${fileUrl}`);
      continue;
    }

    try {
      console.log(`  🔄 Migrating ${field} for product ${product.id}: ${fileUrl}`);
      
      let fullUrl = fileUrl;
      if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('/objects/')) {
        fullUrl = `http://localhost:5000${fileUrl}`;
      }

      const response = await axios.get(fullUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const fileBuffer = Buffer.from(response.data);
      const fileName = fileUrl.split('/').pop() || `file-${Date.now()}.pdf`;
      const contentType = response.headers['content-type'] || 'application/pdf';

      const uploadResult = await s3Service.uploadFile(
        fileBuffer,
        fileName,
        contentType,
        folder
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      await db
        .update(shopProducts)
        .set({ [field]: uploadResult.url })
        .where(eq(shopProducts.id, product.id));

      console.log(`  ✅ Updated ${field} for product ${product.id}`);
      stats.migratedImages++;

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      stats.failedImages++;
      stats.errors.push(`${product.id}/${field}: ${error.message}`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateObjectsToS3()
    .then(() => {
      console.log('✅ Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateObjectsToS3 };

import { db } from './db';
import { shopProducts } from '../shared/schema';
import { AwsS3Service } from './aws-s3-service';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';
import axios from 'axios';

async function migrateObjectsToS3() {
  console.log('🚀 [MIGRATION] Starting migration from Replit Objects to S3...\n');

  try {
    // Initialize S3 service
    const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
    
    if (settings.length === 0) {
      throw new Error('No active S3 settings found');
    }

    const s3Service = new AwsS3Service(settings[0]);
    console.log('✅ S3 Service initialized\n');

    // Get all products with images
    const products = await db.select().from(shopProducts);
    
    let totalMigrated = 0;
    let totalFailed = 0;

    for (const product of products) {
      if (!product.imageUrls) {
        continue;
      }

      // Handle both JSON and plain text formats
      let imageUrls: any[];
      try {
        if (typeof product.imageUrls === 'string') {
          imageUrls = JSON.parse(product.imageUrls);
        } else {
          imageUrls = product.imageUrls as any[];
        }
      } catch (e) {
        console.log(`  ⚠️  Skipping product ${product.id} - invalid image_urls format`);
        continue;
      }

      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        continue;
      }

      const newImageUrls: string[] = [];
      let productChanged = false;

      console.log(`\n📦 Processing product: ${product.name} (ID: ${product.id})`);

      for (const url of imageUrls) {
        if (typeof url !== 'string') continue;

        // Check if URL is from Replit Objects
        if (url.includes('/objects/')) {
          try {
            console.log(`  🔄 Migrating: ${url}`);
            
            // Download from Replit Objects
            const fullUrl = url.startsWith('http') ? url : `https://momtazchem.com${url}`;
            const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
            const fileBuffer = Buffer.from(response.data);
            
            // Extract filename
            const fileName = url.split('/').pop() || 'unknown';
            
            // Determine content type
            let contentType = 'image/jpeg';
            if (fileName.endsWith('.png')) contentType = 'image/png';
            else if (fileName.endsWith('.webp')) contentType = 'image/webp';
            else if (fileName.endsWith('.gif')) contentType = 'image/gif';

            // Upload to S3 product-images folder
            const uploadResult = await s3Service.uploadPublicFile(
              fileBuffer,
              fileName,
              contentType,
              'product-images'
            );

            if (uploadResult.success) {
              // Convert S3 URL to local proxy format
              const newUrl = `/uploads/product-images/${fileName}`;
              newImageUrls.push(newUrl);
              console.log(`  ✅ Migrated to: ${newUrl}`);
              totalMigrated++;
              productChanged = true;
            } else {
              console.log(`  ❌ Failed to upload: ${uploadResult.message}`);
              newImageUrls.push(url); // Keep original
              totalFailed++;
            }
          } catch (error) {
            console.log(`  ❌ Error migrating: ${error.message}`);
            newImageUrls.push(url); // Keep original
            totalFailed++;
          }
        } else if (url.includes('/uploads/images/')) {
          // Old local format - convert to new format
          const fileName = url.split('/').pop();
          const newUrl = `/uploads/product-images/${fileName}`;
          newImageUrls.push(newUrl);
          productChanged = true;
          console.log(`  🔄 Converted URL: ${url} → ${newUrl}`);
        } else {
          // Already in correct format
          newImageUrls.push(url);
        }
      }

      // Update database if changes were made
      if (productChanged && newImageUrls.length > 0) {
        await db
          .update(shopProducts)
          .set({ imageUrls: JSON.stringify(newImageUrls) })
          .where(sql`id = ${product.id}`);
        
        console.log(`  💾 Database updated with ${newImageUrls.length} images`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ [MIGRATION] Complete!');
    console.log(`📊 Total migrated: ${totalMigrated}`);
    console.log(`❌ Total failed: ${totalFailed}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    throw error;
  }
}

// Run migration
migrateObjectsToS3()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

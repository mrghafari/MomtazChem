import { db } from './db';
import { shopProducts } from '../shared/schema';
import { AwsS3Service } from './aws-s3-service';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function syncDbWithS3() {
  console.log('🔄 [SYNC] Syncing database with S3 files...\n');

  try {
    const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
    
    if (settings.length === 0) {
      throw new Error('No active S3 settings found');
    }

    const s3Service = new AwsS3Service(settings[0]);
    
    // List all files in S3 product-images folder
    const command = new ListObjectsV2Command({
      Bucket: settings[0].bucketName,
      Prefix: 'product-images/',
    });

    const response = await s3Service['client'].send(command);
    const s3Files = new Set((response.Contents || []).map(file => file.Key?.replace('product-images/', '')));
    
    console.log(`📋 Found ${s3Files.size} files in S3\n`);

    // Get all products with images
    const products = await db.select().from(shopProducts);
    
    let totalUpdated = 0;

    for (const product of products) {
      if (!product.imageUrls) continue;

      let imageUrls: any[];
      try {
        if (typeof product.imageUrls === 'string') {
          imageUrls = JSON.parse(product.imageUrls);
        } else {
          imageUrls = product.imageUrls as any[];
        }
      } catch (e) {
        continue;
      }

      if (!Array.isArray(imageUrls) || imageUrls.length === 0) continue;

      const newImageUrls: string[] = [];
      let productChanged = false;

      console.log(`\n📦 Product: ${product.name} (ID: ${product.id})`);

      for (const url of imageUrls) {
        if (typeof url !== 'string') continue;

        // Extract filename from URL
        const fileName = url.split('/').pop();
        
        if (!fileName) {
          newImageUrls.push(url);
          continue;
        }

        // Check if file exists in S3
        if (s3Files.has(fileName)) {
          const newUrl = `/uploads/product-images/${fileName}`;
          newImageUrls.push(newUrl);
          console.log(`  ✅ Found: ${fileName}`);
        } else {
          console.log(`  ❌ Missing: ${fileName} - keeping URL: ${url}`);
          newImageUrls.push(url);
        }

        if (url !== `/uploads/product-images/${fileName}`) {
          productChanged = true;
        }
      }

      // Update database if changes were made
      if (productChanged && newImageUrls.length > 0) {
        await db
          .update(shopProducts)
          .set({ imageUrls: JSON.stringify(newImageUrls) })
          .where(sql`id = ${product.id}`);
        
        console.log(`  💾 Database updated`);
        totalUpdated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ [SYNC] Complete!');
    console.log(`📊 Total products updated: ${totalUpdated}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ [SYNC] Error:', error);
    throw error;
  }
}

syncDbWithS3()
  .then(() => {
    console.log('Sync finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Sync failed:', error);
    process.exit(1);
  });

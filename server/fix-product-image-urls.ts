import { db } from './db';
import { shopProducts } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function fixProductImageUrls() {
  console.log('🔄 [FIX] Starting product image URL migration to local proxy format...');

  try {
    // Get all products with image URLs
    const products = await db.select({
      id: shopProducts.id,
      imageUrls: shopProducts.imageUrls,
    }).from(shopProducts);

    console.log(`📦 [FIX] Found ${products.length} products to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      if (!product.imageUrls || product.imageUrls.length === 0) {
        continue;
      }

      let hasChanges = false;
      const newImageUrls = product.imageUrls.map((url: string) => {
        // Skip if already in local proxy format
        if (url.startsWith('/uploads/')) {
          return url;
        }

        // Convert S3 URL to local proxy format
        if (url.includes('momtazchem.s3.') || url.includes('.amazonaws.com')) {
          hasChanges = true;
          
          // Extract the key (path after bucket name)
          // Format: https://bucket.s3.region.amazonaws.com/folder/file.ext
          const match = url.match(/amazonaws\.com\/(.+)$/);
          if (match) {
            const key = match[1];
            const localUrl = `/uploads/${key}`;
            console.log(`  🔀 [FIX] ${url.substring(0, 60)}... → ${localUrl}`);
            return localUrl;
          }
        }

        return url;
      });

      if (hasChanges) {
        await db.update(shopProducts)
          .set({ imageUrls: newImageUrls })
          .where(sql`${shopProducts.id} = ${product.id}`);
        
        updatedCount++;
        console.log(`✅ [FIX] Updated product ${product.id} (${newImageUrls.length} images)`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 [FIX] Migration Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products (already using local URLs)`);
    console.log(`\n✨ [FIX] Product image URL migration completed!`);

  } catch (error) {
    console.error('❌ [FIX] Error during migration:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixProductImageUrls();

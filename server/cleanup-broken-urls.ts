import { db } from './db';
import { shopProducts } from '@shared/shop-schema';
import { eq } from 'drizzle-orm';

async function cleanupBrokenUrls() {
  console.log('🧹 Starting cleanup of broken URLs...\n');

  let updatedCount = 0;

  // Get all products with images
  const products = await db.select().from(shopProducts);

  for (const product of products) {
    let hasChanges = false;
    let newImageUrls = product.imageUrls as string[] || [];

    // Filter out broken /uploads/images/ URLs, keep only S3 URLs and working /objects/ URLs
    if (newImageUrls.length > 0) {
      const filteredUrls = newImageUrls.filter(url => {
        // Keep S3 URLs
        if (url.includes('s3.') || url.includes('amazonaws.com')) {
          return true;
        }
        // Keep /objects/ URLs (they work)
        if (url.startsWith('/objects/')) {
          return true;
        }
        // Remove /uploads/ URLs (they're broken - files don't exist)
        if (url.startsWith('/uploads/')) {
          console.log(`  🗑️  Removing broken URL from product ${product.id}: ${url}`);
          return false;
        }
        return true;
      });

      if (filteredUrls.length !== newImageUrls.length) {
        hasChanges = true;
        newImageUrls = filteredUrls;
      }
    }

    // Update product if changes were made
    if (hasChanges && newImageUrls.length > 0) {
      await db
        .update(shopProducts)
        .set({ imageUrls: newImageUrls })
        .where(eq(shopProducts.id, product.id));
      
      console.log(`✅ Updated product ${product.id}: ${product.name}`);
      console.log(`   Remaining URLs: ${newImageUrls.length}`);
      updatedCount++;
    } else if (hasChanges && newImageUrls.length === 0) {
      console.log(`⚠️  Product ${product.id} would have no images after cleanup - skipping`);
    }
  }

  console.log(`\n✅ Cleanup completed! Updated ${updatedCount} products`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupBrokenUrls()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { cleanupBrokenUrls };

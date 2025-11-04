import { db } from './db';
import { shopProducts } from '@shared/shop-schema';
import { eq } from 'drizzle-orm';

async function convertS3UrlsToLocal() {
  console.log('🔄 Converting S3 URLs to local proxy URLs...\n');

  let updatedCount = 0;

  // Get all products with images
  const products = await db.select().from(shopProducts);

  for (const product of products) {
    let hasChanges = false;
    let newImageUrls = product.imageUrls as string[] || [];

    // Convert S3 URLs to local proxy URLs
    if (newImageUrls.length > 0) {
      const convertedUrls = newImageUrls.map(url => {
        // If it's an S3 URL, extract the filename and convert to local format
        if (url.includes('s3.') || url.includes('amazonaws.com')) {
          // Extract the S3 key (e.g., "images/1762286005740-77045086084039af.jpg")
          const match = url.match(/\/images\/([^/?]+)/);
          if (match && match[1]) {
            const fileName = match[1];
            const localUrl = `/uploads/images/${fileName}`;
            console.log(`  🔄 Converting: ${url} → ${localUrl}`);
            hasChanges = true;
            return localUrl;
          }
        }
        return url;
      });

      if (hasChanges) {
        newImageUrls = convertedUrls;
      }
    }

    // Update product if changes were made
    if (hasChanges) {
      await db
        .update(shopProducts)
        .set({ imageUrls: newImageUrls })
        .where(eq(shopProducts.id, product.id));
      
      console.log(`✅ Updated product ${product.id}: ${product.name}`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Conversion completed! Updated ${updatedCount} products`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  convertS3UrlsToLocal()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { convertS3UrlsToLocal };

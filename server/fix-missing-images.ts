import { db } from './db';
import { shopProducts } from '../shared/schema';
import { AwsS3Service } from './aws-s3-service';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';
import axios from 'axios';

async function fixMissingImages() {
  console.log('🔧 [FIX] Uploading missing images to S3...\n');

  try {
    const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
    
    if (settings.length === 0) {
      throw new Error('No active S3 settings found');
    }

    const s3Service = new AwsS3Service(settings[0]);
    console.log('✅ S3 Service initialized\n');

    // List of missing files that need to be uploaded
    const missingFiles = [
      { name: 'product-1754492845775-152439449.jpeg', url: '/uploads/images/product-1754492845775-152439449.jpeg' },
      { name: 'product-1755492821626-122755276.jpg', url: '/uploads/images/product-1755492821626-122755276.jpg' },
      { name: '1762288558109-748ed2839c4159c4.png', url: '/uploads/product-images/1762288558109-748ed2839c4159c4.png' },
      { name: '1762288572738-f49e1fc996f78a56.png', url: '/uploads/product-images/1762288572738-f49e1fc996f78a56.png' },
      { name: '1762288582345-fc4775fc3caae706.png', url: '/uploads/product-images/1762288582345-fc4775fc3caae706.png' },
      { name: '1762315385052-6a2ae644da319e70.png', url: '/uploads/product-images/1762315385052-6a2ae644da319e70.png' },
      { name: 'product-1755150312614-512744559.jpg', url: '/uploads/images/product-1755150312614-512744559.jpg' },
      { name: 'product-1756833712206-797343865.png', url: '/uploads/images/product-1756833712206-797343865.png' },
      { name: 'product-1756898802581-188697684.jpg', url: '/uploads/images/product-1756898802581-188697684.jpg' },
      { name: 'product-1755492619056-737362270.jpg', url: '/uploads/images/product-1755492619056-737362270.jpg' },
      { name: 'product-1755492930085-910707439.jpg', url: '/uploads/images/product-1755492930085-910707439.jpg' },
    ];

    let totalUploaded = 0;
    let totalFailed = 0;

    for (const file of missingFiles) {
      try {
        console.log(`\n🔄 Processing: ${file.name}`);
        
        // Try to download from momtazchem.com
        const fullUrl = `https://momtazchem.com${file.url}`;
        console.log(`  📥 Downloading from: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(response.data);
        
        // Determine content type
        let contentType = 'image/jpeg';
        if (file.name.endsWith('.png')) contentType = 'image/png';
        else if (file.name.endsWith('.webp')) contentType = 'image/webp';
        else if (file.name.endsWith('.gif')) contentType = 'image/gif';

        // Upload to S3 with ORIGINAL filename
        const uploadResult = await s3Service.uploadPublicFile(
          fileBuffer,
          file.name,
          contentType,
          'product-images',
          { preserveFileName: true }
        );

        if (uploadResult.success) {
          console.log(`  ✅ Uploaded: product-images/${file.name}`);
          totalUploaded++;
        } else {
          console.log(`  ❌ Failed: ${uploadResult.message}`);
          totalFailed++;
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        totalFailed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ [FIX] Complete!');
    console.log(`📊 Total uploaded: ${totalUploaded}`);
    console.log(`❌ Total failed: ${totalFailed}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ [FIX] Error:', error);
    throw error;
  }
}

fixMissingImages()
  .then(() => {
    console.log('Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  });

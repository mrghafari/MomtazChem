import { db } from './db';
import { AwsS3Service } from './aws-s3-service';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';
import axios from 'axios';

async function fixObjectsImages() {
  console.log('🔧 [FIX] Uploading images from /objects/...\n');

  try {
    const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
    
    if (settings.length === 0) {
      throw new Error('No active S3 settings found');
    }

    const s3Service = new AwsS3Service(settings[0]);
    console.log('✅ S3 Service initialized\n');

    // Files that exist in /objects/
    const objectFiles = [
      { name: 'product-1755492821626-122755276.jpg', url: '/objects/images/product-1755492821626-122755276.jpg' },
      { name: 'product-1755150312614-512744559.jpg', url: '/objects/images/product-1755150312614-512744559.jpg' },
      { name: 'product-1756833712206-797343865.png', url: '/objects/images/product-1756833712206-797343865.png' },
      { name: 'product-1756898802581-188697684.jpg', url: '/objects/images/product-1756898802581-188697684.jpg' },
      { name: 'product-1755492619056-737362270.jpg', url: '/objects/images/product-1755492619056-737362270.jpg' },
      { name: 'product-1755492930085-910707439.jpg', url: '/objects/images/product-1755492930085-910707439.jpg' },
    ];

    let totalUploaded = 0;
    let totalFailed = 0;

    for (const file of objectFiles) {
      try {
        console.log(`\n🔄 Processing: ${file.name}`);
        
        const fullUrl = `https://momtazchem.com${file.url}`;
        console.log(`  📥 Downloading from: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(response.data);
        
        let contentType = 'image/jpeg';
        if (file.name.endsWith('.png')) contentType = 'image/png';
        else if (file.name.endsWith('.webp')) contentType = 'image/webp';
        else if (file.name.endsWith('.gif')) contentType = 'image/gif';

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

fixObjectsImages()
  .then(() => {
    console.log('Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  });

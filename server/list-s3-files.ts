import { db } from './db';
import { AwsS3Service } from './aws-s3-service';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function listS3Files() {
  console.log('📋 [S3 LIST] Fetching S3 files...\n');

  try {
    const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
    
    if (settings.length === 0) {
      throw new Error('No active S3 settings found');
    }

    const s3Service = new AwsS3Service(settings[0]);
    
    const command = new ListObjectsV2Command({
      Bucket: settings[0].bucketName,
      Prefix: 'product-images/',
    });

    const response = await s3Service['client'].send(command);
    
    console.log(`Found ${response.Contents?.length || 0} files in product-images/:\n`);
    
    if (response.Contents) {
      response.Contents.forEach((file) => {
        console.log(`  📄 ${file.Key}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

listS3Files()
  .then(() => {
    console.log('\n✅ Listing complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Listing failed:', error);
    process.exit(1);
  });

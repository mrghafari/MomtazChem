/**
 * Update AWS credentials in database with new values
 */

import { db } from './db';
import { awsS3Settings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from './aws-s3-service';

async function updateAwsCredentials(): Promise<void> {
  try {
    console.log('🔄 [AWS UPDATE] Updating AWS credentials in database...\n');

    // New credentials from user
    const newCredentials = {
      accessKeyId: 'AKIAYLLSZQTM4PTO2D4F',
      secretAccessKey: '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',
      region: 'eu-central-1',
      bucketName: 'momtazchem'
    };

    console.log('📋 New Credentials to Save:');
    console.log(`   Access Key ID: ${newCredentials.accessKeyId}`);
    console.log(`   Secret Access Key: ${newCredentials.secretAccessKey.substring(0, 10)}...`);
    console.log(`   Region: ${newCredentials.region}`);
    console.log(`   Bucket: ${newCredentials.bucketName}\n`);

    // Encrypt credentials
    const encryptedAccessKey = encrypt(newCredentials.accessKeyId);
    const encryptedSecretKey = encrypt(newCredentials.secretAccessKey);

    console.log('🔐 Encrypting credentials...');

    // Update in database
    const result = await db
      .update(awsS3Settings)
      .set({
        accessKeyId: encryptedAccessKey,
        secretAccessKey: encryptedSecretKey,
        region: newCredentials.region,
        bucketName: newCredentials.bucketName,
        updatedAt: new Date(),
        description: 'AWS S3 credentials updated with correct keys'
      })
      .where(eq(awsS3Settings.id, 1))
      .returning();

    if (result && result.length > 0) {
      console.log('\n✅ [AWS UPDATE] Credentials updated successfully in database!');
      console.log(`   ID: ${result[0].id}`);
      console.log(`   Region: ${result[0].region}`);
      console.log(`   Bucket: ${result[0].bucketName}`);
      console.log(`   Updated At: ${result[0].updatedAt}`);
      console.log('\n🎉 AWS S3 is now configured with the correct credentials!');
    } else {
      console.error('❌ Failed to update credentials');
    }

  } catch (error) {
    console.error('❌ Error updating AWS credentials:', error);
    throw error;
  }
}

// Auto-run when executed
updateAwsCredentials().then(() => {
  console.log('\n✅ Update completed');
}).catch(error => {
  console.error('\n❌ Update failed:', error);
});

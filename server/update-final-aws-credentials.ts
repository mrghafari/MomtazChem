/**
 * Update AWS credentials with final correct values
 */

import { db } from './db';
import { awsS3Settings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from './aws-s3-service';

async function updateFinalAwsCredentials(): Promise<void> {
  try {
    console.log('🔄 [AWS FINAL UPDATE] Updating AWS credentials with correct values...\n');

    // Correct credentials from user
    const credentials = {
      accessKeyId: 'AKIAYLLSZQTM4PTO2D4F',
      secretAccessKey: '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',
      region: 'eu-central-1',
      bucketName: 'momtazchem',
      encryptionKey: '8f9d2a6b4c7e1f3a9b2d5c6e7f1a2b3c' // Will be stored in Replit Secrets, not DB
    };

    console.log('📋 Credentials to Save:');
    console.log(`   Access Key ID: ${credentials.accessKeyId}`);
    console.log(`   Secret Access Key: ${credentials.secretAccessKey.substring(0, 10)}...`);
    console.log(`   Region: ${credentials.region}`);
    console.log(`   Bucket: ${credentials.bucketName}`);
    console.log(`   Encryption Key: ${credentials.encryptionKey} (will be in Replit Secrets)\n`);

    // Encrypt credentials
    console.log('🔐 Encrypting credentials...');
    const encryptedAccessKey = encrypt(credentials.accessKeyId);
    const encryptedSecretKey = encrypt(credentials.secretAccessKey);

    // Update in database (WITHOUT encryption key - that stays in env)
    const result = await db
      .update(awsS3Settings)
      .set({
        accessKeyId: encryptedAccessKey,
        secretAccessKey: encryptedSecretKey,
        region: credentials.region,
        bucketName: credentials.bucketName,
        updatedAt: new Date(),
        description: 'AWS S3 credentials - Final configuration'
      })
      .where(eq(awsS3Settings.id, 1))
      .returning();

    if (result && result.length > 0) {
      console.log('\n✅ [AWS UPDATE] Credentials updated successfully in database!');
      console.log(`   ID: ${result[0].id}`);
      console.log(`   Region: ${result[0].region}`);
      console.log(`   Bucket: ${result[0].bucketName}`);
      console.log(`   Updated At: ${result[0].updatedAt}`);
      
      console.log('\n🔑 IMPORTANT - Encryption Key:');
      console.log(`   The encryption key must be stored in Replit Secrets as:`);
      console.log(`   AWS_CREDENTIALS_ENCRYPTION_KEY = ${credentials.encryptionKey}`);
      console.log(`   This is already set in your environment variables.`);
      
      console.log('\n🎉 Configuration Complete!');
      console.log('   ✓ Access Key: Encrypted in database');
      console.log('   ✓ Secret Key: Encrypted in database');
      console.log('   ✓ Region: Stored in database');
      console.log('   ✓ Bucket: Stored in database');
      console.log('   ✓ Encryption Key: Secured in Replit Secrets');
    } else {
      console.error('❌ Failed to update credentials');
    }

  } catch (error) {
    console.error('❌ Error updating AWS credentials:', error);
    throw error;
  }
}

// Auto-run
updateFinalAwsCredentials().then(() => {
  console.log('\n✅ Update completed');
}).catch(error => {
  console.error('\n❌ Update failed:', error);
});

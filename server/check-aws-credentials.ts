/**
 * Script to verify AWS credentials in database
 */

import { db } from './db';
import { awsS3Settings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './aws-s3-service';

export async function checkAwsCredentials(): Promise<void> {
  try {
    console.log('🔍 [AWS CHECK] Checking AWS credentials in database...\n');

    // Get settings from database
    const settings = await db
      .select()
      .from(awsS3Settings)
      .where(eq(awsS3Settings.isActive, true))
      .limit(1);

    if (!settings || settings.length === 0) {
      console.log('❌ No active AWS S3 settings found in database');
      return;
    }

    const config = settings[0];
    
    console.log('📋 Database Record:');
    console.log(`   ID: ${config.id}`);
    console.log(`   Region: ${config.region}`);
    console.log(`   Bucket: ${config.bucketName}`);
    console.log(`   Active: ${config.isActive}`);
    console.log(`   Created: ${config.createdAt}`);
    console.log(`   Updated: ${config.updatedAt}`);
    console.log('');

    // Decrypt credentials
    try {
      const decryptedAccessKey = decrypt(config.accessKeyId);
      const decryptedSecretKey = decrypt(config.secretAccessKey);

      console.log('🔐 Decrypted Credentials:');
      console.log(`   Access Key ID: ${decryptedAccessKey}`);
      console.log(`   Secret Access Key: ${decryptedSecretKey.substring(0, 10)}...${decryptedSecretKey.substring(decryptedSecretKey.length - 4)}`);
      console.log('');
      
      console.log('✅ Credentials successfully decrypted from database!');
      
      // Compare with environment variables
      const envAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const envSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      const envRegion = process.env.AWS_REGION;
      const envBucket = process.env.AWS_S3_BUCKET_NAME;

      console.log('');
      console.log('🔄 Comparison with Environment Variables:');
      console.log(`   Access Key Match: ${decryptedAccessKey === envAccessKey ? '✅ YES' : '❌ NO'}`);
      console.log(`   Secret Key Match: ${decryptedSecretKey === envSecretKey ? '✅ YES' : '❌ NO'}`);
      console.log(`   Region Match: ${config.region === envRegion ? '✅ YES' : '❌ NO'}`);
      console.log(`   Bucket Match: ${config.bucketName === envBucket ? '✅ YES' : '❌ NO'}`);

    } catch (decryptError) {
      console.error('❌ Error decrypting credentials:', decryptError);
      console.log('\n⚠️  This might indicate:');
      console.log('   - Wrong AWS_CREDENTIALS_ENCRYPTION_KEY');
      console.log('   - Corrupted encrypted data');
      console.log('   - Different encryption algorithm');
    }

  } catch (error) {
    console.error('❌ Error checking AWS credentials:', error);
  }
}

// Auto-run when executed
checkAwsCredentials().then(() => {
  console.log('\n✅ Check completed');
}).catch(error => {
  console.error('\n❌ Check failed:', error);
});

/**
 * One-time migration script to save AWS credentials from environment variables to database
 * This script encrypts and stores AWS credentials securely in the database
 */

import { db } from './db';
import { awsS3Settings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from './aws-s3-service';

export async function migrateAwsCredentialsToDatabase(): Promise<void> {
  try {
    console.log('🔄 [AWS MIGRATION] Starting AWS credentials migration to database...');

    // Read credentials from environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      console.log('⚠️ [AWS MIGRATION] Missing AWS environment variables, skipping migration');
      return;
    }

    console.log('📋 [AWS MIGRATION] Found AWS credentials in environment variables');
    console.log(`   - Region: ${region}`);
    console.log(`   - Bucket: ${bucketName}`);

    // Encrypt sensitive credentials
    const encryptedAccessKeyId = encrypt(accessKeyId);
    const encryptedSecretAccessKey = encrypt(secretAccessKey);

    console.log('🔐 [AWS MIGRATION] Credentials encrypted successfully');

    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(awsS3Settings)
      .where(eq(awsS3Settings.isActive, true))
      .limit(1);

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      console.log(`🔄 [AWS MIGRATION] Updating existing AWS S3 settings (ID: ${existingSettings[0].id})`);
      
      await db
        .update(awsS3Settings)
        .set({
          accessKeyId: encryptedAccessKeyId,
          secretAccessKey: encryptedSecretAccessKey,
          region,
          bucketName,
          updatedAt: new Date(),
          description: 'AWS S3 credentials from environment variables (auto-migrated)'
        })
        .where(eq(awsS3Settings.id, existingSettings[0].id));

      console.log('✅ [AWS MIGRATION] AWS credentials updated in database successfully');
    } else {
      // Create new settings
      console.log('➕ [AWS MIGRATION] Creating new AWS S3 settings entry');
      
      await db.insert(awsS3Settings).values({
        accessKeyId: encryptedAccessKeyId,
        secretAccessKey: encryptedSecretAccessKey,
        region,
        bucketName,
        isActive: true,
        description: 'AWS S3 credentials from environment variables (auto-migrated)'
      });

      console.log('✅ [AWS MIGRATION] AWS credentials saved to database successfully');
    }

    console.log('🎉 [AWS MIGRATION] Migration completed successfully!');
    console.log('💡 [AWS MIGRATION] AWS credentials are now stored securely in the database');

  } catch (error) {
    console.error('❌ [AWS MIGRATION] Error migrating AWS credentials:', error);
    throw error;
  }
}

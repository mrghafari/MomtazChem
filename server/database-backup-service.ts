import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { databaseBackups, backupSchedules } from '../shared/schema';
import { getAwsS3Service } from './aws-s3-service';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

export class DatabaseBackupService {
  private tempDir = '/tmp';

  /**
   * Create a database backup and upload to S3
   */
  async createBackup(options: {
    backupType?: 'manual' | 'scheduled';
    scheduleId?: number;
    createdBy?: number;
    notes?: string;
  }): Promise<{ success: boolean; backupId?: number; error?: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `momtazchem-backup-${timestamp}.sql.gz`;
    const tempFilePath = join(this.tempDir, fileName);

    let backupId: number | undefined;

    try {
      // Step 1: Create backup record with pending status
      const [backupRecord] = await db.insert(databaseBackups).values({
        fileName,
        s3Key: `backups/${fileName}`,
        s3Bucket: 'momtazchem', // Will be updated from S3 settings
        fileSize: 0, // Will be updated after backup
        backupType: options.backupType || 'manual',
        scheduleId: options.scheduleId,
        status: 'in_progress',
      }).returning();

      backupId = backupRecord.id;

      // Step 2: Perform pg_dump
      await this.performPgDump(tempFilePath);

      // Step 3: Get file size
      const stats = statSync(tempFilePath);
      const fileSize = stats.size;

      // Step 4: Upload to S3
      const s3Service = getAwsS3Service();
      if (!s3Service) {
        throw new Error('AWS S3 service not configured');
      }

      const s3Key = `backups/${fileName}`;
      await s3Service.uploadFile(tempFilePath, s3Key, {
        contentType: 'application/gzip',
        metadata: {
          'backup-id': String(backupRecord.id),
          'backup-type': options.backupType || 'manual',
          'created-at': new Date().toISOString(),
        },
      });

      // Step 5: Update backup record
      await db.update(databaseBackups)
        .set({
          status: 'completed',
          fileSize,
          completedAt: new Date(),
          s3Bucket: s3Service.getBucketName(),
        })
        .where(eq(databaseBackups.id, backupId));

      // Step 6: Clean up temp file
      unlinkSync(tempFilePath);

      console.log(`✅ Backup created successfully: ${fileName} (${this.formatFileSize(fileSize)})`);

      return { success: true, backupId };
    } catch (error) {
      console.error('❌ Backup failed:', error);

      // Update backup record with error
      if (backupId) {
        await db.update(databaseBackups)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          })
          .where(eq(databaseBackups.id, backupId));
      }

      // Clean up temp file if exists
      try {
        unlinkSync(tempFilePath);
      } catch {}

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform pg_dump with compression
   */
  private async performPgDump(outputPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Use pg_dump with gzip compression
    const command = `pg_dump "${databaseUrl}" | gzip > "${outputPath}"`;

    try {
      const { stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      });

      if (stderr && !stderr.includes('NOTICE')) {
        console.warn('pg_dump warnings:', stderr);
      }
    } catch (error) {
      throw new Error(`pg_dump failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a backup from S3
   */
  async downloadBackup(backupId: number): Promise<{ stream: NodeJS.ReadableStream; fileName: string } | null> {
    const [backup] = await db
      .select()
      .from(databaseBackups)
      .where(eq(databaseBackups.id, backupId));

    if (!backup) {
      return null;
    }

    const s3Service = getAwsS3Service();
    if (!s3Service) {
      throw new Error('AWS S3 service not configured');
    }

    const stream = await s3Service.getFileStream(backup.s3Key);
    return { stream, fileName: backup.fileName };
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: number): Promise<boolean> {
    const [backup] = await db
      .select()
      .from(databaseBackups)
      .where(eq(databaseBackups.id, backupId));

    if (!backup) {
      return false;
    }

    const s3Service = getAwsS3Service();
    if (!s3Service) {
      throw new Error('AWS S3 service not configured');
    }

    // Delete from S3
    await s3Service.deleteFile(backup.s3Key);

    // Delete from database
    await db.delete(databaseBackups).where(eq(databaseBackups.id, backupId));

    return true;
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    const schedules = await db
      .select()
      .from(backupSchedules)
      .where(eq(backupSchedules.isActive, true));

    let deletedCount = 0;

    for (const schedule of schedules) {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - schedule.retentionDays);

      const oldBackups = await db
        .select()
        .from(databaseBackups)
        .where(eq(databaseBackups.scheduleId, schedule.id));

      for (const backup of oldBackups) {
        if (backup.createdAt < retentionDate && backup.status === 'completed') {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Singleton instance
let backupService: DatabaseBackupService | null = null;

export function getBackupService(): DatabaseBackupService {
  if (!backupService) {
    backupService = new DatabaseBackupService();
  }
  return backupService;
}

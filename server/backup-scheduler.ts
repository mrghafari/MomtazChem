import { CronJob } from 'cron';
import { db } from './db';
import { backupSchedules } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getBackupService } from './database-backup-service';

export class BackupScheduler {
  private jobs: Map<number, CronJob> = new Map();
  private isInitialized = false;

  /**
   * Initialize the scheduler and load all active schedules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⏰ Backup scheduler already initialized');
      return;
    }

    console.log('🚀 Initializing backup scheduler...');

    // Load all active schedules
    const schedules = await db
      .select()
      .from(backupSchedules)
      .where(eq(backupSchedules.isActive, true));

    for (const schedule of schedules) {
      this.scheduleBackup(schedule);
    }

    this.isInitialized = true;
    console.log(`✅ Backup scheduler initialized with ${schedules.length} active schedules`);
  }

  /**
   * Schedule a backup job
   */
  scheduleBackup(schedule: {
    id: number;
    name: string;
    frequency: string;
    timeOfDay: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    isActive: boolean | null;
  }): void {
    // Stop existing job if any
    this.stopSchedule(schedule.id);

    if (schedule.isActive !== true) {
      return;
    }

    // Parse cron expression based on frequency
    const cronExpression = this.getCronExpression(schedule);
    
    if (!cronExpression) {
      console.error(`❌ Invalid schedule configuration for ${schedule.name}`);
      return;
    }

    try {
      const job = new CronJob(
        cronExpression,
        async () => {
          console.log(`⏰ Running scheduled backup: ${schedule.name}`);
          await this.executeScheduledBackup(schedule.id);
        },
        null,
        true,
        'UTC'
      );

      this.jobs.set(schedule.id, job);
      
      const nextRun = job.nextDate();
      console.log(`✅ Scheduled "${schedule.name}" - Next run: ${nextRun.toISOString()}`);

      // Update next run time in database
      db.update(backupSchedules)
        .set({ nextRunAt: nextRun.toJSDate() })
        .where(eq(backupSchedules.id, schedule.id))
        .then(() => {})
        .catch(err => console.error('Failed to update next run time:', err));
    } catch (error) {
      console.error(`❌ Failed to schedule backup "${schedule.name}":`, error);
    }
  }

  /**
   * Stop a scheduled backup
   */
  stopSchedule(scheduleId: number): void {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.stop();
      this.jobs.delete(scheduleId);
      console.log(`⏸️ Stopped schedule #${scheduleId}`);
    }
  }

  /**
   * Execute a scheduled backup
   */
  private async executeScheduledBackup(scheduleId: number): Promise<void> {
    const backupService = getBackupService();

    try {
      const result = await backupService.createBackup({
        backupType: 'scheduled',
        scheduleId,
      });

      if (result.success) {
        // Update last run time
        await db.update(backupSchedules)
          .set({ lastRunAt: new Date() })
          .where(eq(backupSchedules.id, scheduleId));

        console.log(`✅ Scheduled backup #${scheduleId} completed successfully`);
      } else {
        console.error(`❌ Scheduled backup #${scheduleId} failed:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error executing scheduled backup #${scheduleId}:`, error);
    }

    // Run cleanup after backup
    try {
      const deletedCount = await backupService.cleanupOldBackups();
      if (deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${deletedCount} old backups`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up old backups:', error);
    }
  }

  /**
   * Get cron expression from schedule configuration
   */
  private getCronExpression(schedule: {
    frequency: string;
    timeOfDay: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
  }): string | null {
    // Parse time (HH:MM format)
    const [hour, minute] = schedule.timeOfDay.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) {
      return null;
    }

    switch (schedule.frequency) {
      case 'daily':
        // Run every day at specified time
        return `${minute} ${hour} * * *`;

      case 'weekly':
        // Run on specified day of week at specified time
        const dayOfWeek = schedule.dayOfWeek ?? 0;
        return `${minute} ${hour} * * ${dayOfWeek}`;

      case 'monthly':
        // Run on specified day of month at specified time
        const dayOfMonth = schedule.dayOfMonth ?? 1;
        return `${minute} ${hour} ${dayOfMonth} * *`;

      default:
        return null;
    }
  }

  /**
   * Reload all schedules (useful after configuration changes)
   */
  async reload(): Promise<void> {
    console.log('🔄 Reloading backup schedules...');
    
    // Stop all current jobs
    this.jobs.forEach((job, id) => {
      job.stop();
    });
    this.jobs.clear();

    // Reload from database
    const schedules = await db
      .select()
      .from(backupSchedules)
      .where(eq(backupSchedules.isActive, true));

    for (const schedule of schedules) {
      this.scheduleBackup(schedule);
    }

    console.log(`✅ Reloaded ${schedules.length} backup schedules`);
  }

  /**
   * Shutdown the scheduler
   */
  shutdown(): void {
    console.log('🛑 Shutting down backup scheduler...');
    this.jobs.forEach((job) => job.stop());
    this.jobs.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
let scheduler: BackupScheduler | null = null;

export function getBackupScheduler(): BackupScheduler {
  if (!scheduler) {
    scheduler = new BackupScheduler();
  }
  return scheduler;
}

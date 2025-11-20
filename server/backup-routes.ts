import { Router } from 'express';
import { db } from './db';
import { databaseBackups, backupSchedules } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getBackupService } from './database-backup-service';
import { getBackupScheduler } from './backup-scheduler';

const router = Router();

// Get all backups
router.get('/api/admin/backups', async (req, res) => {
  try {
    const backups = await db
      .select()
      .from(databaseBackups)
      .orderBy(desc(databaseBackups.createdAt));

    res.json(backups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'Failed to fetch backups' });
  }
});

// Create manual backup
router.post('/api/admin/backups/create', async (req, res) => {
  try {
    const { notes } = req.body;
    const userId = (req.user as any)?.id;

    const backupService = getBackupService();
    const result = await backupService.createBackup({
      backupType: 'manual',
      createdBy: userId,
      notes,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backupId: result.backupId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Backup creation failed',
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Failed to create backup' });
  }
});

// Download backup
router.get('/api/admin/backups/:id/download', async (req, res) => {
  try {
    const backupId = parseInt(req.params.id);
    const backupService = getBackupService();

    const result = await backupService.downloadBackup(backupId);

    if (!result) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    result.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ message: 'Failed to download backup' });
  }
});

// Delete backup
router.delete('/api/admin/backups/:id', async (req, res) => {
  try {
    const backupId = parseInt(req.params.id);
    const backupService = getBackupService();

    const success = await backupService.deleteBackup(backupId);

    if (success) {
      res.json({ success: true, message: 'Backup deleted successfully' });
    } else {
      res.status(404).json({ message: 'Backup not found' });
    }
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: 'Failed to delete backup' });
  }
});

// Get all backup schedules
router.get('/api/admin/backup-schedules', async (req, res) => {
  try {
    const schedules = await db
      .select()
      .from(backupSchedules)
      .orderBy(backupSchedules.name);

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching backup schedules:', error);
    res.status(500).json({ message: 'Failed to fetch backup schedules' });
  }
});

// Create backup schedule
router.post('/api/admin/backup-schedules', async (req, res) => {
  try {
    const { name, frequency, timeOfDay, dayOfWeek, dayOfMonth, retentionDays, notes } = req.body;
    const userId = (req.user as any)?.id;

    const [schedule] = await db.insert(backupSchedules).values({
      name,
      frequency,
      timeOfDay,
      dayOfWeek,
      dayOfMonth,
      retentionDays,
      isActive: true,
      createdBy: userId,
      notes,
    }).returning();

    // Schedule the backup job
    const scheduler = getBackupScheduler();
    scheduler.scheduleBackup(schedule);

    res.json({
      success: true,
      message: 'Backup schedule created successfully',
      schedule,
    });
  } catch (error) {
    console.error('Error creating backup schedule:', error);
    res.status(500).json({ message: 'Failed to create backup schedule' });
  }
});

// Update backup schedule
router.put('/api/admin/backup-schedules/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const { name, frequency, timeOfDay, dayOfWeek, dayOfMonth, retentionDays, isActive, notes } = req.body;

    const [schedule] = await db.update(backupSchedules)
      .set({
        name,
        frequency,
        timeOfDay,
        dayOfWeek,
        dayOfMonth,
        retentionDays,
        isActive,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(backupSchedules.id, scheduleId))
      .returning();

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Reschedule the backup job
    const scheduler = getBackupScheduler();
    scheduler.scheduleBackup(schedule);

    res.json({
      success: true,
      message: 'Backup schedule updated successfully',
      schedule,
    });
  } catch (error) {
    console.error('Error updating backup schedule:', error);
    res.status(500).json({ message: 'Failed to update backup schedule' });
  }
});

// Delete backup schedule
router.delete('/api/admin/backup-schedules/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);

    // Stop the scheduled job
    const scheduler = getBackupScheduler();
    scheduler.stopSchedule(scheduleId);

    await db.delete(backupSchedules).where(eq(backupSchedules.id, scheduleId));

    res.json({ success: true, message: 'Backup schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup schedule:', error);
    res.status(500).json({ message: 'Failed to delete backup schedule' });
  }
});

export default router;

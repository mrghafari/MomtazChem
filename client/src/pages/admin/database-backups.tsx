import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Database, 
  Download, 
  Trash2, 
  Plus, 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DatabaseBackup {
  id: number;
  fileName: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  backupType: 'manual' | 'scheduled';
  scheduleId: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  notes: string | null;
}

interface BackupSchedule {
  id: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  retentionDays: number;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  notes: string | null;
}

export default function DatabaseBackupsPage() {
  const { toast } = useToast();
  const [showCreateBackupDialog, setShowCreateBackupDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const [backupNotes, setBackupNotes] = useState("");

  // Fetch backups
  const { data: backups, isLoading: loadingBackups } = useQuery<DatabaseBackup[]>({
    queryKey: ['/api/admin/backups'],
  });

  // Fetch schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery<BackupSchedule[]>({
    queryKey: ['/api/admin/backup-schedules'],
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest('/api/admin/backups/create', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Backup Created",
        description: "Database backup is being created and uploaded to Amazon S3",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
      setShowCreateBackupDialog(false);
      setBackupNotes("");
    },
    onError: () => {
      toast({
        title: "❌ Backup Failed",
        description: "Failed to create database backup",
        variant: "destructive",
      });
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/backups/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Backup Deleted",
        description: "Backup has been deleted from S3",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
    },
    onError: () => {
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/backup-schedules/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Schedule Deleted",
        description: "Backup schedule has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-schedules'] });
    },
    onError: () => {
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const handleDownload = (backup: DatabaseBackup) => {
    window.open(`/api/admin/backups/${backup.id}/download`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Backups
          </h1>
          <p className="text-gray-600 mt-1">Manage database backups and automated schedules</p>
        </div>
        <Button onClick={() => setShowCreateBackupDialog(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Backup Now
        </Button>
      </div>

      {/* Backups List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Backups</h2>
        </div>

        {loadingBackups ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !backups || backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No backups created yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.fileName}</TableCell>
                  <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                  <TableCell>
                    <Badge variant={backup.backupType === 'manual' ? 'default' : 'secondary'}>
                      {backup.backupType}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell>{formatDate(backup.completedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {backup.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(backup)}
                          data-testid={`button-download-backup-${backup.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBackupMutation.mutate(backup.id)}
                        disabled={deleteBackupMutation.isPending}
                        data-testid={`button-delete-backup-${backup.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Schedules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Backup Schedules
          </h2>
          <Button onClick={() => {
            setEditingSchedule(null);
            setShowScheduleDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>

        {loadingSchedules ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !schedules || schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No schedules configured yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.name}</TableCell>
                  <TableCell className="capitalize">{schedule.frequency}</TableCell>
                  <TableCell>{schedule.timeOfDay}</TableCell>
                  <TableCell>{schedule.retentionDays} days</TableCell>
                  <TableCell>
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(schedule.lastRunAt)}</TableCell>
                  <TableCell>{formatDate(schedule.nextRunAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setShowScheduleDialog(true);
                        }}
                        data-testid={`button-edit-schedule-${schedule.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        disabled={deleteScheduleMutation.isPending}
                        data-testid={`button-delete-schedule-${schedule.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateBackupDialog} onOpenChange={setShowCreateBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Manual Backup</DialogTitle>
            <DialogDescription>
              Create an immediate backup of the database and upload it to Amazon S3
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Backup notes..."
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                data-testid="input-backup-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBackupDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createBackupMutation.mutate(backupNotes)}
              disabled={createBackupMutation.isPending}
              data-testid="button-confirm-create-backup"
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        schedule={editingSchedule}
      />
    </div>
  );
}

// Schedule Dialog Component
interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: BackupSchedule | null;
}

function ScheduleDialog({ open, onOpenChange, schedule }: ScheduleDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    timeOfDay: '02:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
    retentionDays: 30,
    isActive: true,
    notes: '',
  });

  // Update form when schedule changes
  useState(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        frequency: schedule.frequency,
        timeOfDay: schedule.timeOfDay,
        dayOfWeek: schedule.dayOfWeek || 0,
        dayOfMonth: schedule.dayOfMonth || 1,
        retentionDays: schedule.retentionDays,
        isActive: schedule.isActive,
        notes: schedule.notes || '',
      });
    } else {
      setFormData({
        name: '',
        frequency: 'daily',
        timeOfDay: '02:00',
        dayOfWeek: 0,
        dayOfMonth: 1,
        retentionDays: 30,
        isActive: true,
        notes: '',
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = schedule
        ? `/api/admin/backup-schedules/${schedule.id}`
        : '/api/admin/backup-schedules';
      
      return apiRequest(url, {
        method: schedule ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Schedule Saved",
        description: "Backup schedule has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-schedules'] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "❌ Save Failed",
        description: "Failed to save backup schedule",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Edit' : 'Create'} Backup Schedule</DialogTitle>
          <DialogDescription>
            Configure automated database backups
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="schedule-name">Schedule Name</Label>
            <Input
              id="schedule-name"
              placeholder="e.g., Daily Backup"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="input-schedule-name"
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger data-testid="select-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="time">Time of Day (HH:MM)</Label>
            <Input
              id="time"
              type="time"
              value={formData.timeOfDay}
              onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
              data-testid="input-time"
            />
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select
                value={String(formData.dayOfWeek)}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-day-of-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div>
              <Label htmlFor="dayOfMonth">Day of Month</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={formData.dayOfMonth}
                onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                data-testid="input-day-of-month"
              />
            </div>
          )}

          <div>
            <Label htmlFor="retention">Retention Period (Days)</Label>
            <Input
              id="retention"
              type="number"
              min="1"
              value={formData.retentionDays}
              onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
              data-testid="input-retention"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="schedule-notes">Notes (Optional)</Label>
            <Input
              id="schedule-notes"
              placeholder="Schedule notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="input-schedule-notes"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              data-testid="checkbox-active"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending || !formData.name}
            data-testid="button-save-schedule"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

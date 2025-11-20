import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table as DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Database, 
  Download, 
  RefreshCw, 
  HardDrive,
  Table,
  FileDown,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Plus,
  Calendar,
  XCircle,
  Loader2,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface BackupFile {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

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
}

interface BackupSchedule {
  id: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  retentionDays: number;
  isActive: boolean | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseStats {
  database_size: string;
  table_count: number;
  total_records: number;
  table_stats: Array<{
    tablename: string;
    live_rows: number;
    actual_count: number;
    total_inserts: number;
    total_updates: number;
    total_deletes: number;
    table_size: string;
    size_bytes: number;
  }>;
}

export default function DatabaseManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    frequency: "daily" as "daily" | "weekly" | "monthly",
    timeOfDay: "02:00",
    dayOfWeek: null as number | null,
    dayOfMonth: null as number | null,
    retentionDays: 30,
    isActive: true,
  });

  // Fetch current user data
  const { data: user } = useQuery<{ user: { id: number; username: string } }>({
    queryKey: ["/api/admin/me"],
  });

  // Fetch database statistics
  const { data: dbStats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ["/api/admin/database/stats"],
  });

  // Fetch backup list (old local backup system)
  const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useQuery<{ backups: BackupFile[] }>({
    queryKey: ["/api/admin/backup/list"],
  });

  // Fetch S3 backups (new system)
  const { data: s3Backups, isLoading: loadingS3Backups } = useQuery<DatabaseBackup[]>({
    queryKey: ['/api/admin/backups'],
  });

  // Fetch backup schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery<BackupSchedule[]>({
    queryKey: ['/api/admin/backup-schedules'],
  });

  // Create local backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/backup/create", { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "بک‌آپ ایجاد شد",
        description: "بک‌آپ جدید با موفقیت ایجاد شد",
      });
      refetchBackups();
      setIsCreatingBackup(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد بک‌آپ",
        description: "مشکلی در ایجاد بک‌آپ رخ داده است",
      });
      setIsCreatingBackup(false);
    },
  });

  // Delete local backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => apiRequest(`/api/admin/backup/delete/${filename}`, { method: "DELETE" }),
    onSuccess: (_, filename) => {
      toast({
        title: "بک‌آپ حذف شد",
        description: `فایل ${filename} با موفقیت حذف شد`,
      });
      refetchBackups();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در حذف بک‌آپ",
        description: "مشکلی در حذف فایل بک‌آپ رخ داده است",
      });
    },
  });

  // S3 Backup mutations
  const createS3BackupMutation = useMutation({
    mutationFn: (notes?: string) => apiRequest("/api/admin/backups/create", { 
      method: "POST",
      body: { notes }
    }),
    onSuccess: () => {
      toast({
        title: "S3 Backup Created",
        description: "بک‌آپ S3 با موفقیت ایجاد شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد بک‌آپ S3",
        description: "مشکلی در ایجاد بک‌آپ S3 رخ داده است",
      });
    },
  });

  const deleteS3BackupMutation = useMutation({
    mutationFn: (backupId: number) => apiRequest(`/api/admin/backups/${backupId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "S3 Backup Deleted",
        description: "بک‌آپ S3 با موفقیت حذف شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در حذف بک‌آپ S3",
        description: "مشکلی در حذف بک‌آپ S3 رخ داده است",
      });
    },
  });

  // Schedule mutations
  const createScheduleMutation = useMutation({
    mutationFn: (data: typeof scheduleForm) => apiRequest("/api/admin/backup-schedules", {
      method: "POST",
      body: data
    }),
    onSuccess: () => {
      toast({
        title: "Schedule Created",
        description: "زمان‌بندی بک‌آپ با موفقیت ایجاد شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-schedules'] });
      setShowScheduleDialog(false);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در ایجاد زمان‌بندی",
        description: "مشکلی در ایجاد زمان‌بندی بک‌آپ رخ داده است",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof scheduleForm }) => 
      apiRequest(`/api/admin/backup-schedules/${id}`, {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      toast({
        title: "Schedule Updated",
        description: "زمان‌بندی بک‌آپ با موفقیت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-schedules'] });
      setShowScheduleDialog(false);
      setEditingSchedule(null);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در به‌روزرسانی زمان‌بندی",
        description: "مشکلی در به‌روزرسانی زمان‌بندی بک‌آپ رخ داده است",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: number) => apiRequest(`/api/admin/backup-schedules/${scheduleId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "Schedule Deleted",
        description: "زمان‌بندی بک‌آپ با موفقیت حذف شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup-schedules'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا در حذف زمان‌بندی",
        description: "مشکلی در حذف زمان‌بندی بک‌آپ رخ داده است",
      });
    },
  });

  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    createBackupMutation.mutate();
  };

  const handleDownloadBackup = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/backup/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "دانلود شروع شد",
      description: `فایل ${filename} در حال دانلود است`,
    });
  };

  const handleDownloadS3Backup = (backupId: number, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/backups/${backupId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "دانلود شروع شد",
      description: `فایل ${fileName} در حال دانلود است`,
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      name: "",
      frequency: "daily",
      timeOfDay: "02:00",
      dayOfWeek: null,
      dayOfMonth: null,
      retentionDays: 30,
      isActive: true,
    });
  };

  const handleEditSchedule = (schedule: BackupSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      frequency: schedule.frequency,
      timeOfDay: schedule.timeOfDay,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      retentionDays: schedule.retentionDays,
      isActive: schedule.isActive ?? true,
    });
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = () => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleForm });
    } else {
      createScheduleMutation.mutate(scheduleForm);
    }
  };

  const handleToggleSchedule = (schedule: BackupSchedule) => {
    updateScheduleMutation.mutate({
      id: schedule.id,
      data: {
        ...schedule,
        isActive: !schedule.isActive,
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: DatabaseBackup['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user?.user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به داشبورد
          </Button>
        )}
        <h1 className="text-2xl font-bold">مدیریت دیتابیس</h1>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : dbStats?.database_size || "Unknown"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables Count</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : dbStats?.table_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : dbStats?.total_records?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backups Count</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupsLoading ? "..." : backupsData?.backups.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Management with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            مدیریت بک‌آپ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Backups (محلی)</TabsTrigger>
              <TabsTrigger value="s3">S3 Backups & Automation (خودکار)</TabsTrigger>
            </TabsList>

            {/* Manual Backups Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup || createBackupMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-create-manual-backup"
                >
                  {isCreatingBackup || createBackupMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  ایجاد بک‌آپ جدید
                </Button>
              </div>

              {backupsLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : backupsData?.backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  هیچ بک‌آپی موجود نیست
                </div>
              ) : (
                <div className="space-y-4">
                  {backupsData?.backups.map((backup) => (
                    <div
                      key={backup.filename}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`backup-item-${backup.filename}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{backup.filename}</h3>
                          <Badge variant="secondary">
                            {formatFileSize(backup.size)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(backup.created)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.filename)}
                          className="flex items-center gap-2"
                          data-testid={`button-download-${backup.filename}`}
                        >
                          <Download className="h-4 w-4" />
                          دانلود
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                              data-testid={`button-delete-${backup.filename}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف فایل بک‌آپ</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا مطمئن هستید که می‌خواهید فایل بک‌آپ "{backup.filename}" را حذف کنید؟ این عمل قابل بازگشت نیست.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>لغو</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBackupMutation.mutate(backup.filename)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteBackupMutation.isPending}
                              >
                                {deleteBackupMutation.isPending ? "در حال حذف..." : "حذف"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* S3 Backups & Automation Tab */}
            <TabsContent value="s3" className="space-y-6">
              {/* S3 Backups Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">S3 Backups</h3>
                  <Button
                    onClick={() => createS3BackupMutation.mutate(undefined)}
                    disabled={createS3BackupMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-create-s3-backup"
                  >
                    {createS3BackupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Manual S3 Backup
                  </Button>
                </div>

                {loadingS3Backups ? (
                  <div className="text-center py-8">Loading S3 backups...</div>
                ) : !s3Backups || s3Backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No S3 backups available
                  </div>
                ) : (
                  <DataTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s3Backups.map((backup) => (
                        <TableRow key={backup.id} data-testid={`s3-backup-row-${backup.id}`}>
                          <TableCell className="font-medium">{backup.fileName}</TableCell>
                          <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                          <TableCell>
                            <Badge variant={backup.backupType === 'manual' ? 'default' : 'secondary'}>
                              {backup.backupType}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell>{formatDate(backup.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {backup.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadS3Backup(backup.id, backup.fileName)}
                                  data-testid={`button-download-s3-${backup.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-s3-${backup.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete S3 Backup</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{backup.fileName}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteS3BackupMutation.mutate(backup.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                )}
              </div>

              {/* Schedule Management Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Backup Schedules (زمان‌بندی)</h3>
                  <Button
                    onClick={() => {
                      resetScheduleForm();
                      setEditingSchedule(null);
                      setShowScheduleDialog(true);
                    }}
                    className="flex items-center gap-2"
                    data-testid="button-create-schedule"
                  >
                    <Plus className="h-4 w-4" />
                    Create Schedule
                  </Button>
                </div>

                {loadingSchedules ? (
                  <div className="text-center py-8">Loading schedules...</div>
                ) : !schedules || schedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No backup schedules configured
                  </div>
                ) : (
                  <DataTable>
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
                        <TableRow key={schedule.id} data-testid={`schedule-row-${schedule.id}`}>
                          <TableCell className="font-medium">{schedule.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{schedule.frequency}</Badge>
                          </TableCell>
                          <TableCell>{schedule.timeOfDay}</TableCell>
                          <TableCell>{schedule.retentionDays} days</TableCell>
                          <TableCell>
                            <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                              {schedule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {schedule.lastRunAt ? formatDate(schedule.lastRunAt) : 'Never'}
                          </TableCell>
                          <TableCell>
                            {schedule.nextRunAt ? formatDate(schedule.nextRunAt) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleSchedule(schedule)}
                                disabled={updateScheduleMutation.isPending}
                                data-testid={`button-toggle-${schedule.id}`}
                              >
                                {schedule.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSchedule(schedule)}
                                data-testid={`button-edit-schedule-${schedule.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-schedule-${schedule.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the schedule "{schedule.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-schedule">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Backup Schedule' : 'Create Backup Schedule'}
            </DialogTitle>
            <DialogDescription>
              Configure automated backup schedule settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Name</Label>
              <Input
                id="schedule-name"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                placeholder="Daily Backup"
                data-testid="input-schedule-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequency</Label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setScheduleForm({ ...scheduleForm, frequency: value })
                  }
                >
                  <SelectTrigger id="schedule-frequency" data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time of Day</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleForm.timeOfDay}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, timeOfDay: e.target.value })}
                  data-testid="input-time"
                />
              </div>
            </div>

            {scheduleForm.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-day-week">Day of Week</Label>
                <Select
                  value={scheduleForm.dayOfWeek?.toString() || ''}
                  onValueChange={(value) =>
                    setScheduleForm({ ...scheduleForm, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger id="schedule-day-week" data-testid="select-day-week">
                    <SelectValue placeholder="Select day" />
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

            {scheduleForm.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-day-month">Day of Month</Label>
                <Input
                  id="schedule-day-month"
                  type="number"
                  min="1"
                  max="31"
                  value={scheduleForm.dayOfMonth || ''}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, dayOfMonth: parseInt(e.target.value) || null })
                  }
                  placeholder="1-31"
                  data-testid="input-day-month"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="schedule-retention">Retention Days</Label>
              <Input
                id="schedule-retention"
                type="number"
                min="1"
                value={scheduleForm.retentionDays}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, retentionDays: parseInt(e.target.value) || 30 })
                }
                data-testid="input-retention"
              />
              <p className="text-sm text-muted-foreground">
                Backups older than this will be automatically deleted
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false);
                setEditingSchedule(null);
                resetScheduleForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchedule}
              disabled={
                !scheduleForm.name ||
                createScheduleMutation.isPending ||
                updateScheduleMutation.isPending
              }
              data-testid="button-save-schedule"
            >
              {createScheduleMutation.isPending || updateScheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingSchedule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Database Table Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {dbStats?.table_stats.slice(0, 15).map((table) => (
                <div key={table.tablename} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{table.tablename}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-50">
                        {table.actual_count?.toLocaleString() || table.live_rows?.toLocaleString() || 0} records
                      </Badge>
                      <Badge variant="secondary" className="bg-green-50">
                        {table.table_size || 'Unknown size'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <span>Inserts: {table.total_inserts?.toLocaleString() || 0}</span>
                    <span>Updates: {table.total_updates?.toLocaleString() || 0}</span>
                    <span>Deletes: {table.total_deletes?.toLocaleString() || 0}</span>
                    <span>Live Rows: {table.live_rows?.toLocaleString() || 0}</span>
                  </div>
                  {table.actual_count > 0 && (
                    <Progress 
                      value={(table.actual_count / Math.max(...dbStats.table_stats.map(t => t.actual_count || t.live_rows || 0))) * 100} 
                      className="h-2" 
                    />
                  )}
                </div>
              ))}
              {dbStats?.table_stats && dbStats.table_stats.length > 15 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  Showing top 15 tables by size. Total tables: {dbStats.table_count}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            راهنمای نصب در سیستم شخصی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">مراحل نصب:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>PostgreSQL را نصب کنید</li>
              <li>یک دیتابیس جدید ایجاد کنید</li>
              <li>فایل بک‌آپ را دانلود و بازیابی کنید</li>
              <li>متغیر DATABASE_URL را تنظیم کنید</li>
              <li>npm install و npm run dev را اجرا کنید</li>
            </ol>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            فایل راهنمای کامل در پوشه پروژه موجود است: PORTABLE_DATABASE_SETUP.md
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
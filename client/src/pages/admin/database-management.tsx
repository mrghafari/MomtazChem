import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface BackupFile {
  filename: string;
  size: number;
  created: string;
  modified: string;
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

  // Fetch database statistics
  const { data: dbStats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ["/api/admin/database/stats"],
  });

  // Fetch backup list
  const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useQuery<{ backups: BackupFile[] }>({
    queryKey: ["/api/admin/backup/list"],
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/backup/create", "POST"),
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

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => apiRequest(`/api/admin/backup/delete/${filename}`, "DELETE"),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user?.id === 1 && (
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

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              مدیریت بک‌آپ
            </CardTitle>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || createBackupMutation.isPending}
              className="flex items-center gap-2"
            >
              {isCreatingBackup || createBackupMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              ایجاد بک‌آپ جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
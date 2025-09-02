import { useState } from 'react';
import SecureFileUploader from '@/components/SecureFileUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, FileCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface UploadLog {
  id: string;
  fileName: string;
  status: 'success' | 'failed';
  timestamp: string;
  report?: string;
  errors?: string[];
}

export default function SecureUploadExample() {
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Fetch system status on component mount
  useState(() => {
    fetch('/api/secure-upload/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error('Error fetching system status:', err));
  });

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result);
    
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      setUploadLogs(prev => [...prev, {
        id: Date.now().toString(),
        fileName: file.name,
        status: 'success',
        timestamp: new Date().toLocaleString('fa-IR'),
        report: 'آپلود موفقیت‌آمیز بود'
      }]);
    }
  };

  const handleSecurityCheck = (fileName: string, isSecure: boolean, report?: string) => {
    console.log('Security check:', { fileName, isSecure, report });
    
    if (!isSecure) {
      setUploadLogs(prev => [...prev, {
        id: Date.now().toString(),
        fileName,
        status: 'failed',
        timestamp: new Date().toLocaleString('fa-IR'),
        errors: [report || 'بررسی امنیتی ناموفق']
      }]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            سیستم آپلود امن
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          سیستم جامع آپلود فایل با امنیت چندلایه، فشردگی خودکار تصاویر، اسکن ویروس و اعتبارسنجی پیشرفته
        </p>
      </div>

      {/* System Status */}
      {systemStatus && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              وضعیت سیستم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-semibold text-green-700">وضعیت</div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {systemStatus.status === 'active' ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700">حداکثر حجم</div>
                <div className="text-sm">{systemStatus.features?.sizeLimit || 'نامشخص'}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700">اسکن ویروس</div>
                <Badge variant={systemStatus.features?.virusScanning ? "default" : "secondary"}>
                  {systemStatus.features?.virusScanning ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700">فشردگی تصاویر</div>
                <Badge variant={systemStatus.features?.imageCompression ? "default" : "secondary"}>
                  {systemStatus.features?.imageCompression ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              آپلود فایل امن
            </CardTitle>
            <CardDescription>
              فایل‌های خود را با اطمینان از امنیت کامل آپلود کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SecureFileUploader
              maxNumberOfFiles={3}
              maxFileSize={10 * 1024 * 1024} // 10MB
              allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']}
              onUploadComplete={handleUploadComplete}
              onSecurityCheck={handleSecurityCheck}
              enableCompression={true}
              enableVirusScanning={true}
              userId="demo-user"
              buttonClassName="w-full"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span>انتخاب فایل برای آپلود امن</span>
              </div>
            </SecureFileUploader>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">ویژگی‌های امنیتی فعال:</div>
                  <ul className="text-sm space-y-1">
                    <li>• بررسی نوع و حجم فایل</li>
                    <li>• اسکن محتوای مخرب</li>
                    <li>• فشردگی خودکار تصاویر</li>
                    <li>• اعتبارسنجی چندلایه</li>
                    <li>• گزارش امنیتی کامل</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Upload Logs */}
        <Card>
          <CardHeader>
            <CardTitle>گزارش آپلودها</CardTitle>
            <CardDescription>
              تاریخچه آپلودها و وضعیت امنیتی آن‌ها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploadLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هنوز فایلی آپلود نشده است
                </div>
              ) : (
                uploadLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{log.fileName}</span>
                      </div>
                      <Badge
                        variant={log.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {log.status === 'success' ? 'موفق' : 'ناموفق'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {log.timestamp}
                    </div>
                    {log.report && (
                      <div className="text-xs mt-2 p-2 bg-white rounded border">
                        {log.report}
                      </div>
                    )}
                    {log.errors && log.errors.length > 0 && (
                      <div className="text-xs mt-2 space-y-1">
                        {log.errors.map((error, index) => (
                          <div key={index} className="text-red-600">
                            • {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported File Types */}
      <Card>
        <CardHeader>
          <CardTitle>انواع فایل‌های پشتیبانی شده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-medium text-blue-600">تصاویر</div>
              <div className="text-sm text-gray-600">JPEG, PNG, GIF, WebP</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">اسناد</div>
              <div className="text-sm text-gray-600">PDF, DOC, DOCX</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">متن</div>
              <div className="text-sm text-gray-600">TXT</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">حداکثر حجم</div>
              <div className="text-sm text-gray-600">10 مگابایت</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
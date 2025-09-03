import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleBankReceiptUploaderProps {
  onUploadComplete?: (fileUrl: string) => void;
  maxFileSize?: number;
  className?: string;
}

export function SimpleBankReceiptUploader({ 
  onUploadComplete, 
  maxFileSize = 5 * 1024 * 1024, // 5MB
  className 
}: SimpleBankReceiptUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setProgress(10);

      // File validation
      if (file.size > maxFileSize) {
        throw new Error(`حجم فایل نباید از ${Math.round(maxFileSize / 1024 / 1024)} مگابایت بیشتر باشد`);
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('فقط فایل‌های تصویری (JPEG, PNG, GIF, WebP) و PDF مجاز هستند');
      }

      setProgress(30);

      // Get upload URL
      const uploadResponse = await fetch('/api/secure-upload/generate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          userId: 'anonymous'
        })
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.errors?.[0] || 'خطا در دریافت آدرس آپلود');
      }

      const uploadData = await uploadResponse.json();
      setProgress(50);

      // Upload file
      const fileUploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!fileUploadResponse.ok) {
        throw new Error('خطا در آپلود فایل');
      }

      setProgress(80);

      // Validate uploaded file
      const validationResponse = await fetch('/api/secure-upload/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: uploadData.uploadUrl,
          fileName: file.name,
          userId: 'anonymous',
          uploadType: 'general'
        })
      });

      const validationResult = await validationResponse.json();
      setProgress(100);

      if (validationResult.success) {
        setUploadStatus('success');
        toast({
          title: "✅ آپلود موفق",
          description: "فیش بانکی با موفقیت آپلود و اعتبارسنجی شد"
        });
        onUploadComplete?.(uploadData.uploadUrl);
      } else {
        throw new Error(validationResult.errors?.[0] || 'خطا در اعتبارسنجی فایل');
      }

    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "❌ خطا در آپلود",
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setUploadStatus('idle');
      }, 3000);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          آپلود فیش بانکی
          <Shield className="h-4 w-4 text-green-600" />
        </CardTitle>
        <CardDescription>
          آپلود ساده و سریع فیش واریزی بانکی
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="simple-bank-receipt-upload"
          />
          <label
            htmlFor="simple-bank-receipt-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <Button disabled={uploading} asChild>
              <span>
                {uploading ? 'در حال آپلود...' : 'انتخاب فیش بانکی'}
              </span>
            </Button>
          </label>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>در حال آپلود...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Status Alerts */}
        {uploadStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              فیش بانکی با موفقیت آپلود شد
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              خطا در آپلود فایل. لطفاً دوباره تلاش کنید
            </AlertDescription>
          </Alert>
        )}

        {/* File Constraints */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• حداکثر حجم: {formatFileSize(maxFileSize)}</p>
          <p>• فرمت‌های مجاز: JPG, PNG, GIF, WebP, PDF</p>
          <p>• اعتبارسنجی خودکار و امن</p>
        </div>
      </CardContent>
    </Card>
  );
}
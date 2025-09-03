import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductImageUploaderProps {
  onUploadComplete?: (imageUrl: string, metadata: any) => void;
  className?: string;
}

export function ProductImageUploader({ onUploadComplete, className }: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<any>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Step 1: Validate file constraints
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "حجم فایل زیاد",
          description: `حجم فایل نباید از 5 مگابایت بیشتر باشد. حجم فعلی: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          variant: "destructive"
        });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "نوع فایل نامعتبر",
          description: "فقط فایل‌های JPEG، PNG، WebP و GIF مجاز هستند",
          variant: "destructive"
        });
        return;
      }

      setUploadProgress(20);

      // Step 2: Get secure upload URL for product images
      const uploadResponse = await fetch('/api/secure-upload/product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          userId: 'test-user'
        })
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.errors?.[0] || 'خطا در دریافت لینک آپلود');
      }

      const uploadData = await uploadResponse.json();
      setCompressionInfo(uploadData.compressionInfo);
      setUploadProgress(40);

      // Step 3: Upload file to secure storage
      const uploadResult = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResult.ok) {
        throw new Error('خطا در آپلود فایل');
      }

      setUploadProgress(70);

      // Step 4: Validate uploaded file with smart compression
      const validationResponse = await fetch('/api/secure-upload/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: uploadData.uploadUrl,
          fileName: file.name,
          userId: 'test-user',
          uploadType: 'product-image'
        })
      });

      const validationResult = await validationResponse.json();
      setUploadProgress(100);

      if (validationResult.success) {
        setUploadedImageUrl(uploadData.uploadUrl);
        
        toast({
          title: "آپلود موفقیت‌آمیز",
          description: validationResult.compressionApplied ? 
            "تصویر با فشردگی هوشمند آپلود شد" : 
            "تصویر بدون نیاز به فشردگی آپلود شد",
        });

        onUploadComplete?.(uploadData.uploadUrl, validationResult.metadata);
      } else {
        throw new Error(validationResult.errors?.[0] || 'خطا در اعتبارسنجی فایل');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطا در آپلود",
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [onUploadComplete, toast]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          آپلود تصویر محصول
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            فشردگی هوشمند
          </Badge>
        </CardTitle>
        <CardDescription>
          تصاویر محصول با حداکثر 5 مگابایت و فشردگی خودکار برای بهترین کیفیت
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="product-image-upload"
          />
          <label
            htmlFor="product-image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <Button disabled={isUploading} asChild>
              <span>
                {isUploading ? 'در حال آپلود...' : 'انتخاب تصویر محصول'}
              </span>
            </Button>
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>در حال پردازش...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Compression Info */}
        {compressionInfo && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>تنظیمات فشردگی هوشمند:</strong><br />
              • کیفیت هدف: {compressionInfo.maxQualityTarget}%<br />
              • حداکثر ابعاد: {compressionInfo.maxDimensions.width}×{compressionInfo.maxDimensions.height}<br />
              • نرخ فشردگی پیش‌بینی شده: {compressionInfo.estimatedCompressionRatio}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Success */}
        {uploadedImageUrl && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              تصویر محصول با موفقیت آپلود و بهینه‌سازی شد
            </AlertDescription>
          </Alert>
        )}

        {/* File Constraints */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">حداکثر 5MB</Badge>
            <Badge variant="outline" className="text-xs">JPEG, PNG, WebP, GIF</Badge>
          </div>
          <p>• فشردگی خودکار با حفظ کیفیت بالا</p>
          <p>• اعتبارسنجی امنیتی چندلایه</p>
          <p>• حداکثر ابعاد: 2048×2048 پیکسل</p>
        </div>
      </CardContent>
    </Card>
  );
}
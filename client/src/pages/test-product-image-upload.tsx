import { useState } from 'react';
import { ProductImageUploader } from '@/components/ProductImageUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Image, Zap, Shield, Gauge } from 'lucide-react';
import { Link } from 'wouter';

export default function TestProductImageUpload() {
  const [uploadedImages, setUploadedImages] = useState<Array<{
    url: string;
    metadata: any;
    timestamp: string;
  }>>([]);

  const handleUploadComplete = (imageUrl: string, metadata: any) => {
    setUploadedImages(prev => [...prev, {
      url: imageUrl,
      metadata,
      timestamp: new Date().toLocaleString('fa-IR')
    }]);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'نامشخص';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} مگابایت`;
  };

  const getCompressionRatio = (original?: number, compressed?: number) => {
    if (!original || !compressed) return null;
    const ratio = ((original - compressed) / original) * 100;
    return ratio.toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Image className="h-8 w-8 text-blue-600" />
            آزمایش آپلود تصویر محصول
            <Badge variant="default" className="text-sm">
              <Sparkles className="h-4 w-4 mr-1" />
              فشردگی هوشمند
            </Badge>
          </h1>
          <p className="text-gray-600 mt-2">
            سیستم آپلود و فشردگی تصاویر محصولات با حداکثر کیفیت و حداقل حجم
          </p>
        </div>
        <Link href="/products">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            بازگشت به محصولات
          </Button>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              فشردگی هوشمند
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              الگوریتم پیشرفته با کیفیت 95% و فشردگی تدریجی
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              امنیت چندلایه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              اسکن ویروس، اعتبارسنجی نوع فایل و بررسی محتوا
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" />
              حداکثر 5 مگابایت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              محدودیت حجم بهینه برای تصاویر محصولات
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Component */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductImageUploader 
          onUploadComplete={handleUploadComplete}
          className="w-full"
        />

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle>تاریخچه آپلودها</CardTitle>
            <CardDescription>
              نتایج آپلود و فشردگی تصاویر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedImages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                هنوز هیچ تصویری آپلود نشده است
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="text-xs">
                        آپلود #{uploadedImages.length - index}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {image.timestamp}
                      </span>
                    </div>
                    
                    {image.metadata && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">حجم اصلی:</span><br />
                          <span className="text-gray-600">
                            {formatFileSize(image.metadata.originalSize)}
                          </span>
                        </div>
                        
                        {image.metadata.compressedSize && (
                          <div>
                            <span className="font-medium">حجم فشرده:</span><br />
                            <span className="text-green-600">
                              {formatFileSize(image.metadata.compressedSize)}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">نوع فایل:</span><br />
                          <span className="text-gray-600">
                            {image.metadata.mimeType}
                          </span>
                        </div>
                        
                        {image.metadata.compressedSize && (
                          <div>
                            <span className="font-medium">نرخ فشردگی:</span><br />
                            <span className="text-blue-600">
                              {getCompressionRatio(
                                image.metadata.originalSize,
                                image.metadata.compressedSize
                              )}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {image.metadata?.compressedSize ? (
                      <Badge variant="default" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        فشردگی اعمال شد
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        بدون نیاز به فشردگی
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
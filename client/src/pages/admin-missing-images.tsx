import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, RefreshCw, ImageOff, CheckCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MissingImage {
  url: string;
  expectedKey: string;
  status: string;
}

interface MissingImagesData {
  totalProducts: number;
  totalImageReferences: number;
  totalInS3: number;
  totalMissing: number;
  missingImages: MissingImage[];
  s3Summary: {
    productImages: number;
    generalFiles: number;
  };
}

export default function AdminMissingImages() {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: MissingImagesData }>({
    queryKey: ['/api/admin/s3/check-missing-images'],
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, expectedKey }: { file: File; expectedKey: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expectedKey', expectedKey);
      
      return await apiRequest('/api/admin/s3/upload-missing-image', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'عکس با موفقیت آپلود شد',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در آپلود عکس',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = async (expectedKey: string, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [expectedKey]: true }));
    try {
      await uploadFileMutation.mutateAsync({ file, expectedKey });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [expectedKey]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const missingData = data?.data;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">مدیریت عکس‌های گمشده</h1>
        <p className="text-muted-foreground">
          لیست عکس‌های محصولاتی که در دیتابیس هستند ولی در S3 موجود نیستند
        </p>
      </div>

      {missingData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">کل محصولات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.totalProducts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">عکس‌ها در S3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{missingData.totalInS3}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">عکس‌های گمشده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{missingData.totalMissing}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">فایل‌های عمومی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingData.s3Summary.generalFiles}</div>
              </CardContent>
            </Card>
          </div>

          {missingData.totalMissing === 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                همه عکس‌های محصولات در S3 موجود هستند! سیستم کاملاً سالم است.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>{missingData.totalMissing} عکس</strong> از S3 گم شده‌اند. این عکس‌ها باید دوباره آپلود شوند.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>لیست عکس‌های گمشده</CardTitle>
                  <CardDescription>
                    برای هر عکس، فایل مربوطه را انتخاب کرده و آپلود کنید
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {missingData.missingImages.map((img, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <ImageOff className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{img.url}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            S3 Key: {img.expectedKey}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(img.expectedKey, file);
                              }
                            }}
                            disabled={uploadingFiles[img.expectedKey]}
                            className="max-w-[200px]"
                            data-testid={`input-upload-${index}`}
                          />
                          {uploadingFiles[img.expectedKey] && (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              بروزرسانی
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

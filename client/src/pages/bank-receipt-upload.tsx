import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, CreditCard, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function BankReceiptUpload() {
  const { orderId: paramOrderId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Get orderId from URL parameters or query string
  useEffect(() => {
    if (paramOrderId) {
      setOrderId(paramOrderId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const queryOrderId = urlParams.get('orderId');
      if (queryOrderId) {
        setOrderId(queryOrderId);
      }
    }
  }, [paramOrderId]);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: [`/api/customers/orders`, orderId],
    queryFn: async () => {
      const response = await apiRequest('/api/customers/orders');
      const orders = response.orders || [];
      return orders.find((o: any) => o.orderNumber === orderId || o.id.toString() === orderId);
    },
    enabled: !!orderId,
  });

  // Fetch company banking information
  const { data: companyInfo, isLoading: isLoadingCompanyInfo } = useQuery({
    queryKey: ['/api/admin/company-information'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/company-information');
      return response;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `/api/payment/upload-receipt`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ فیش بانکی آپلود شد",
        description: "فیش واریزی شما با موفقیت ارسال شد و در حال بررسی است",
      });
      
      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      setNotes("");
      
      // Redirect to order status page
      setTimeout(() => {
        window.location.href = `/customer/profile`;
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در آپلود",
        description: error.message || "خطا در آپلود فیش بانکی",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "فرمت فایل نامعتبر",
          description: "لطفاً فایل‌های JPG، PNG، WebP یا PDF انتخاب کنید",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم فایل زیاد",
          description: "حداکثر حجم فایل 10 مگابایت است",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "فایل انتخاب نشده",
        description: "لطفاً ابتدا فیش بانکی را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('receipt', selectedFile);
    formData.append('notes', notes);
    formData.append('orderId', orderId || '');

    uploadMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoadingOrder) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">آپلود فیش واریزی بانکی</h1>
          <p className="text-muted-foreground">
            لطفاً فیش واریزی بانکی خود را برای تایید پرداخت آپلود کنید
          </p>
        </div>
      </div>

      {/* Order Summary */}
      {order && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              خلاصه سفارش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">شماره سفارش:</span>
                <span className="font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مبلغ قابل پرداخت:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(parseFloat(order.totalAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وضعیت:</span>
                <span className="text-orange-600">در انتظار پرداخت</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banking Information - Dynamic from Company Info */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            اطلاعات حساب بانکی
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCompanyInfo ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">در حال بارگذاری اطلاعات بانکی...</p>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">نام بانک:</span>
                  <p className="text-muted-foreground">
                    {companyInfo?.bankName || 'بانک ملی عراق'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">شماره حساب:</span>
                  <p className="font-mono">
                    {companyInfo?.bankAccount || 'در انتظار تکمیل اطلاعات'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">نام صاحب حساب:</span>
                  <p className="text-muted-foreground">
                    {companyInfo?.companyNameAr || companyInfo?.companyNameEn || 'شرکت ممتاز شیمی'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">شماره IBAN:</span>
                  <p className="font-mono">
                    {companyInfo?.bankIban || 'در انتظار تکمیل اطلاعات'}
                  </p>
                </div>
              </div>
              {companyInfo?.bankSwift && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">کد SWIFT:</span>
                    <p className="font-mono">{companyInfo.bankSwift}</p>
                  </div>
                </div>
              )}
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ لطفاً مبلغ دقیق سفارش را واریز کرده و فیش واریزی را آپلود کنید
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            آپلود فیش بانکی
          </CardTitle>
          <CardDescription>
            فرمت‌های مجاز: JPG، PNG، WebP، PDF (حداکثر 10 مگابایت)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div>
            <Label htmlFor="receipt-file">انتخاب فایل</Label>
            <Input
              id="receipt-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} مگابایت
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>در حال آپلود...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">توضیحات (اختیاری)</Label>
            <Textarea
              id="notes"
              placeholder="توضیحات اضافی در مورد واریز..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Upload className="w-4 h-4 ml-2 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                آپلود فیش بانکی
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              راهنمای آپلود
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• فیش واریزی باید واضح و خوانا باشد</li>
              <li>• مبلغ واریزی باید با مبلغ سفارش مطابقت داشته باشد</li>
              <li>• تاریخ واریز نباید بیش از 7 روز گذشته باشد</li>
              <li>• پس از آپلود، سفارش شما در کمتر از 24 ساعت بررسی می‌شود</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
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
  const [receiptAmount, setReceiptAmount] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Get orderId from URL parameters or query string
  useEffect(() => {
    console.log('🔍 [URL DEBUG] paramOrderId:', paramOrderId);
    console.log('🔍 [URL DEBUG] window.location:', window.location.href);
    if (paramOrderId) {
      console.log('🔍 [URL DEBUG] Setting orderId from param:', paramOrderId);
      setOrderId(paramOrderId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const queryOrderId = urlParams.get('orderId');
      console.log('🔍 [URL DEBUG] Query orderId:', queryOrderId);
      if (queryOrderId) {
        console.log('🔍 [URL DEBUG] Setting orderId from query:', queryOrderId);
        setOrderId(queryOrderId);
      } else {
        console.log('🔍 [URL DEBUG] No order ID found in URL or query parameters');
      }
    }
    console.log('🔍 [URL DEBUG] Final orderId state will be:', paramOrderId || new URLSearchParams(window.location.search).get('orderId'));
  }, [paramOrderId]);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: [`/api/customers/orders`, orderId],
    queryFn: async () => {
      console.log('🔍 [ORDER DEBUG] Fetching orders for orderId:', orderId);
      const response = await apiRequest('/api/customers/orders', { method: 'GET' });
      console.log('🔍 [ORDER DEBUG] Orders response:', response);
      const orders = response.orders || [];
      console.log('🔍 [ORDER DEBUG] Available orders:', orders.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, totalAmount: o.totalAmount })));
      const foundOrder = orders.find((o: any) => o.orderNumber === orderId || o.id.toString() === orderId);
      console.log('🔍 [ORDER DEBUG] Found order:', foundOrder);
      return foundOrder;
    },
    enabled: !!orderId,
  });

  // Fetch company banking information from public endpoint
  const { data: companyInfo, isLoading: isLoadingCompanyInfo } = useQuery({
    queryKey: ['/api/company/banking-info'],
    queryFn: async () => {
      const response = await apiRequest('/api/company/banking-info', { method: 'GET' });
      return response.data;
    },
  });

  // Fetch customer information including wallet balance
  const { data: customer } = useQuery({
    queryKey: ['/api/customers/me'],
    queryFn: async () => {
      const response = await apiRequest('/api/customers/me', { method: 'GET' });
      return response.customer;
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

    if (!receiptAmount || receiptAmount.trim() === '') {
      toast({
        title: "مبلغ فیش بانکی اجباری است",
        description: "لطفاً مبلغ واریزی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(receiptAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "مبلغ نامعتبر",
        description: "لطفاً مبلغ صحیح وارد کنید",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('receipt', selectedFile);
    formData.append('notes', notes);
    formData.append('receiptAmount', receiptAmount);
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
                    {companyInfo?.bankAccountHolder || companyInfo?.companyNameAr || companyInfo?.companyNameEn || 'شرکت ممتاز شیمی'}
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

          {/* Receipt Amount - Required Field */}
          <div>
            <Label htmlFor="receipt-amount" className="flex items-center gap-2">
              مبلغ فیش بانکی (اجباری)
              <span className="text-red-500">*</span>
            </Label>
            
            <div className="flex gap-3 items-end">
              {/* Receipt Amount Input */}
              <div className="flex-1">
                <Input
                  id="receipt-amount"
                  type="number"
                  placeholder="مبلغ واریزی به دینار عراقی"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="mt-1"
                  required
                  min={order ? parseFloat(order.totalAmount) : 0}
                />
              </div>
              
              {/* Order Debt Amount Display */}
              {order ? (
                <div className="flex-1">
                  <Label className="text-sm text-gray-600">مبلغ بدهی سفارش</Label>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 mt-1">
                    <p className="text-lg font-bold text-orange-800 dark:text-orange-200 text-center">
                      {parseFloat(order.totalAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 text-center">
                      دینار عراقی
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <Label className="text-sm text-gray-600">مبلغ بدهی سفارش</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {isLoadingOrder ? 'در حال بارگذاری...' : orderId ? 'سفارش یافت نشد' : 'شناسه سفارش مشخص نیست'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                      {orderId && `شناسه: ${orderId}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Information */}
            {order && (
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    💡 حداقل مبلغ واریزی باید برابر با بدهی سفارش باشد. در صورت واریز بیشتر، مبلغ اضافی به والت شما اضافه می‌شود. در صورت واریز کمتر و کفایت موجودی والت، کمبود از والت کسر خواهد شد.
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-300">
                    ⏰ مبلغ اضافه واریزی فیش بانکی پس از اینکه فیش توسط واحد مالی تایید شد به والت مشتری اضافه خواهد شد
                  </p>
                </div>
              </div>
            )}
            
            {receiptAmount && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  مبلغ وارد شده: {parseInt(receiptAmount).toLocaleString()} دینار عراقی
                </p>
                {order && receiptAmount && (
                  <div>
                    {parseInt(receiptAmount) < parseFloat(order.totalAmount) ? (
                      <div className="space-y-1">
                        <p className="text-sm text-orange-600">
                          ⚠️ مبلغ کمتر از بدهی شما است. کمبود: {(parseFloat(order.totalAmount) - parseInt(receiptAmount)).toLocaleString()} دینار
                        </p>
                        {customer?.walletBalance !== undefined && (
                          <p className="text-xs text-gray-600">
                            💰 موجودی والت شما: {customer.walletBalance.toLocaleString()} دینار
                            {customer.walletBalance >= (parseFloat(order.totalAmount) - parseInt(receiptAmount)) ? (
                              <span className="text-green-600 block">✅ والت شما کمبود را پوشش می‌دهد - کمبود از والت کسر خواهد شد</span>
                            ) : (
                              <span className="text-yellow-600 block">⚠️ موجودی والت برای پوشش کمبود کافی نیست - فیش برای تایید مدیر مالی ارسال خواهد شد</span>
                            )}
                          </p>
                        )}
                      </div>
                    ) : parseInt(receiptAmount) > parseFloat(order.totalAmount) ? (
                      <p className="text-sm text-green-600">
                        ✅ مبلغ اضافی {(parseInt(receiptAmount) - parseFloat(order.totalAmount)).toLocaleString()} دینار به والت شما اضافه خواهد شد
                      </p>
                    ) : (
                      <p className="text-sm text-green-600">
                        ✅ مبلغ دقیقاً برابر با بدهی شما است
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
            disabled={!selectedFile || !receiptAmount || uploadMutation.isPending}
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
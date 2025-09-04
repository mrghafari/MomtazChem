import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertCircle, Shield, Building2, X, Eye, FileText, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SimpleBankReceiptUploader } from "@/components/SimpleBankReceiptUploader";

interface BankReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onSuccess?: () => void;
}

export function BankReceiptUploadModal({ 
  open, 
  onOpenChange, 
  orderNumber,
  onSuccess
}: BankReceiptUploadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [securityStatus, setSecurityStatus] = useState<string>("");

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: [`/api/customers/orders/${orderNumber}`],
    queryFn: async () => {
      const response = await apiRequest('/api/customers/orders', { method: 'GET' });
      const orders = response.orders || [];
      return orders.find((o: any) => o.orderNumber === orderNumber || o.id.toString() === orderNumber) || null;
    },
    enabled: open && !!orderNumber,
  });

  // Fetch company banking information
  const { data: companyInfo, isLoading: isLoadingCompanyInfo } = useQuery({
    queryKey: ['/api/company/banking-info'],
    queryFn: async () => {
      const response = await apiRequest('/api/company/banking-info', { method: 'GET' });
      return response.data;
    },
    enabled: open,
  });

  // Fetch customer information including wallet balance
  const { data: customer } = useQuery({
    queryKey: ['/api/customers/me'],
    queryFn: async () => {
      const response = await apiRequest('/api/customers/me', { method: 'GET' });
      return response.customer;
    },
    enabled: open,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ receiptUrl, orderId, notes }: { receiptUrl: string; orderId: string; notes: string }) => {
      const response = await apiRequest('/api/payment/upload-receipt', {
        method: 'POST',
        body: {
          receiptUrl,
          orderId,
          notes,
          securityValidated: true
        }
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ فیش بانکی آپلود شد",
        description: "فیش واریزی شما با موفقیت ثبت شد و برای بررسی ارسال گردید",
      });
      
      // Reset form
      setUploadedFileUrl(null);
      setUploadProgress(0);
      setNotes("");
      setReceiptAmount("");
      setSecurityStatus("");
      
      // Refresh orders data
      queryClient.invalidateQueries({ queryKey: ['/api/customers/orders'] });
      
      // Call success callback and close modal
      onSuccess?.();
      onOpenChange(false);
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

  // Handle upload completion
  const handleUploadComplete = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl);
    setUploadProgress(100);
    setSecurityStatus("✅ فایل با موفقیت آپلود و اعتبارسنجی شد");
  };

  // Handle secure upload
  const handleSecureUpload = async () => {
    if (!uploadedFileUrl) {
      toast({
        title: "فایل آپلود نشده",
        description: "لطفاً ابتدا فیش بانکی را آپلود کنید",
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

    try {
      const secureObjectPath = uploadedFileUrl.split('?')[0];
      await uploadMutation.mutateAsync({
        receiptUrl: secureObjectPath,
        orderId: orderNumber,
        notes: notes + (receiptAmount ? ` | مبلغ: ${receiptAmount} دینار` : ''),
      });
    } catch (error: any) {
      toast({
        title: "خطا در ثبت اطلاعات",
        description: error.message || "خطا در ثبت اطلاعات فیش بانکی",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to detect file type
  const getFileType = (filePath: string): 'pdf' | 'image' | 'unknown' => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    return 'unknown';
  };

  // Simple receipt viewer - just show the receipt
  const renderReceiptViewer = (receiptPath: string) => {
    const fileType = getFileType(receiptPath);
    const fullPath = receiptPath.startsWith('http') ? receiptPath : `/${receiptPath}`;
    
    return (
      <div className="space-y-4">
        {/* Simple header */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-green-700 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            مشاهده فیش بانکی
          </h3>
          <p className="text-sm text-gray-600 mt-1">فیش واریزی سفارش شما</p>
        </div>

        {/* Full screen receipt display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-lg">
          {fileType === 'pdf' ? (
            <div className="w-full" style={{ height: '70vh' }}>
              <iframe
                src={fullPath}
                className="w-full h-full rounded-lg"
                title="فیش بانکی PDF"
                style={{ border: 'none' }}
              />
            </div>
          ) : fileType === 'image' ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={fullPath}
                alt="فیش بانکی"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentNode as HTMLElement;
                  parent.innerHTML = '<div class="p-8 text-center text-gray-500"><div class="text-4xl mb-2">⚠️</div>خطا در نمایش تصویر</div>';
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">فیش بانکی</p>
              <p className="text-sm text-gray-500">
                نوع فایل: {receiptPath.split('.').pop()?.toUpperCase()}
              </p>
              <Button
                onClick={() => window.open(fullPath, '_blank')}
                className="mt-4"
                variant="outline"
              >
                <Eye className="w-4 h-4 ml-2" />
                مشاهده در صفحه جدید
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            آپلود فیش واریزی بانکی
          </DialogTitle>
          <DialogDescription>
            لطفاً فیش واریزی بانکی خود را برای تایید پرداخت آپلود کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          {isLoadingOrder ? (
            <div className="text-center py-4">در حال بارگذاری اطلاعات سفارش...</div>
          ) : order ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                خلاصه سفارش
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">شماره سفارش:</span>
                  <span className="font-mono ml-2">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">مبلغ قابل پرداخت:</span>
                  <span className="font-bold ml-2 text-primary">
                    {formatCurrency(parseFloat(order.totalAmount))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                ⚠️ سفارش با شماره {orderNumber} یافت نشد
              </p>
            </div>
          )}

          {/* Banking Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="flex items-center gap-2 font-semibold mb-3">
              <Building2 className="w-5 h-5 text-green-600" />
              اطلاعات حساب بانکی شرکت
            </h3>
            {isLoadingCompanyInfo ? (
              <p className="text-center text-gray-500">در حال بارگذاری اطلاعات بانکی...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">نام بانک:</span>
                  <p className="text-gray-600">{companyInfo?.bankName || 'بانک ملی عراق'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">شماره حساب:</span>
                  <p className="font-mono text-gray-600">{companyInfo?.bankAccount || 'در انتظار تکمیل'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">نام صاحب حساب:</span>
                  <p className="text-gray-600">{companyInfo?.bankAccountHolder || 'شرکت ممتاز شیمی'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">شماره IBAN:</span>
                  <p className="font-mono text-gray-600">{companyInfo?.bankIban || 'در انتظار تکمیل'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Display Existing Receipt (if available) */}
          {order?.receiptPath && (
            <div>
              {renderReceiptViewer(order.receiptPath)}
            </div>
          )}

          {/* File Upload - Only show if no existing receipt */}
          {!order?.receiptPath && (
            <div className="border rounded-lg p-4">
              <SimpleBankReceiptUploader
                onUploadComplete={handleUploadComplete}
                maxFileSize={5 * 1024 * 1024}
                className="border-0 shadow-none"
              />

            {/* Security Status */}
            {securityStatus && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 dark:text-blue-200">{securityStatus}</p>
              </div>
            )}

            {/* Upload Success */}
            {uploadedFileUrl && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">✅ فیش بانکی آماده ثبت است</p>
                  <p className="text-xs text-green-600">فایل از بررسی‌های امنیتی عبور کرد</p>
                </div>
              </div>
            )}

            {/* Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>در حال پردازش...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
            </div>
          )}

          {/* Receipt Amount - Only show if no existing receipt */}
          {!order?.receiptPath && (
          <div className="space-y-3">
            <Label htmlFor="receipt-amount" className="flex items-center gap-2">
              مبلغ فیش بانکی (اجباری)
              <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  id="receipt-amount"
                  type="number"
                  placeholder="مبلغ واریزی به دینار عراقی"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  required
                  min={order ? parseFloat(order.totalAmount) : 0}
                />
              </div>
              {order && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                  <p className="text-sm text-gray-600">مبلغ بدهی سفارش</p>
                  <p className="font-bold text-orange-800">
                    {parseFloat(order.totalAmount).toLocaleString()} دینار
                  </p>
                </div>
              )}
            </div>
            
            {/* Amount validation messages */}
            {receiptAmount && order && (
              <div className="text-sm">
                {parseInt(receiptAmount) < parseFloat(order.totalAmount) ? (
                  <p className="text-orange-600">
                    ⚠️ کمبود: {(parseFloat(order.totalAmount) - parseInt(receiptAmount)).toLocaleString()} دینار
                  </p>
                ) : parseInt(receiptAmount) > parseFloat(order.totalAmount) ? (
                  <p className="text-blue-600">
                    💰 اضافی: {(parseInt(receiptAmount) - parseFloat(order.totalAmount)).toLocaleString()} دینار (به والت اضافه می‌شود)
                  </p>
                ) : (
                  <p className="text-green-600">✅ مبلغ دقیقاً برابر با بدهی است</p>
                )}
              </div>
            )}
            </div>
          )}

          {/* Notes - Only show if no existing receipt */}
          {!order?.receiptPath && (
            <div className="space-y-2">
              <Label htmlFor="notes">توضیحات (اختیاری)</Label>
              <Textarea
                id="notes"
                placeholder="توضیحات اضافی..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Submit Button - Only show if no existing receipt */}
          {!order?.receiptPath && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSecureUpload}
                disabled={!uploadedFileUrl || !receiptAmount || uploadMutation.isPending}
                className="flex-1"
                size="lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Shield className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 ml-2" />
                    ثبت نهایی فیش بانکی
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={uploadMutation.isPending}
              >
                <X className="w-4 h-4 ml-2" />
                لغو
              </Button>
            </div>
          )}

          {/* Close button for existing receipts */}
          {order?.receiptPath && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 ml-2" />
                بستن
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
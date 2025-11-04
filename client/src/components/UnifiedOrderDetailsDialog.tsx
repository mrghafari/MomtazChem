import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar,
  Hash,
  Weight,
  DollarSign,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';

interface UnifiedOrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  orderId?: number;
  hidePrice?: boolean; // برای بخش لجستیک
}

export default function UnifiedOrderDetailsDialog({ 
  open, 
  onOpenChange, 
  orderNumber,
  orderId,
  hidePrice = false 
}: UnifiedOrderDetailsDialogProps) {
  // Fetch order details
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/orders', orderId || orderNumber],
    queryFn: async () => {
      const url = orderId 
        ? `/api/admin/orders/${orderId}/details`
        : `/api/customers/orders/${orderNumber}/details`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
    enabled: open && (!!orderId || !!orderNumber),
  });

  const order = data?.order || data?.data;
  const items = data?.items || order?.items || [];

  // فرمت تاریخ
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'نامشخص';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'نامشخص';
    }
  };

  // فرمت قیمت
  const formatPrice = (price?: string | number) => {
    if (!price) return '0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // ترجمه روش پرداخت
  const translatePaymentMethod = (method?: string) => {
    if (!method) return 'نامشخص';
    const translations: Record<string, string> = {
      'bank_transfer': 'انتقال بانکی',
      'wallet': 'کیف پول',
      'wallet_partial': 'ترکیبی (کیف پول + بانک)',
      'hybrid': 'ترکیبی (بانک + کیف پول)',
      'credit': 'مدت‌دار',
      'cash': 'نقدی',
      'card': 'کارت',
      'fib': 'درگاه FIB',
      'online_payment': 'پرداخت آنلاین'
    };
    return translations[method] || method;
  };

  // ترجمه وضعیت
  const translateStatus = (status?: string) => {
    if (!status) return 'نامشخص';
    const translations: Record<string, string> = {
      'pending': 'در انتظار',
      'finance_pending': 'در انتظار بررسی مالی',
      'financial': 'بررسی مالی',
      'warehouse_pending': 'در انتظار انبار',
      'warehouse_processing': 'در حال پردازش در انبار',
      'ready_for_delivery': 'آماده ارسال',
      'logistics_pending': 'در انتظار لجستیک',
      'in_transit': 'در حال ارسال',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده',
      'rejected': 'رد شده'
    };
    return translations[status] || status;
  };

  // استخراج نام مشتری
  const getCustomerName = () => {
    if (order?.customerName) return order.customerName;
    if (order?.customer?.firstName || order?.customer?.lastName) {
      return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
    }
    if (order?.customerFirstName || order?.customerLastName) {
      return `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
    }
    return 'نامشخص';
  };

  // استخراج آدرس
  const getShippingAddress = () => {
    if (order?.shippingAddress) {
      if (typeof order.shippingAddress === 'string') {
        return order.shippingAddress;
      }
      // اگر یک آبجکت باشد
      const addr = order.shippingAddress;
      return `${addr.address || ''}, ${addr.city || ''}, کد پستی: ${addr.postalCode || ''}`.trim();
    }
    if (order?.recipientAddress) {
      return order.recipientAddress;
    }
    return 'آدرس وارد نشده';
  };

  const status = order?.currentStatus || order?.status || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              جزئیات سفارش {order?.orderNumber || '...'}
            </span>
            {order && (
              <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
                {translateStatus(status)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>خطا در بارگذاری اطلاعات سفارش</span>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* تاریخ و ساعت سفارش */}
              <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">تاریخ ثبت سفارش:</span>
                <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
              </div>

              <Separator />

              {/* اطلاعات خریدار */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  اطلاعات خریدار
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mr-6 bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">نام و نام خانوادگی</p>
                      <p className="font-medium">{getCustomerName()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">شماره تماس</p>
                      <p className="font-medium" dir="ltr">
                        {order.customerPhone || order.customer?.phone || order.recipientPhone || 'وارد نشده'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">ایمیل</p>
                      <p className="font-medium" dir="ltr">
                        {order.customerEmail || order.customer?.email || 'وارد نشده'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* آدرس تحویل */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  آدرس تحویل
                </h4>
                <div className="mr-6 bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{getShippingAddress()}</p>
                  {order.recipientName && order.recipientName !== getCustomerName() && (
                    <p className="text-xs text-muted-foreground mt-2">
                      تحویل گیرنده: {order.recipientName}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* اقلام سفارش */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  اقلام سفارش
                </h4>
                {items && items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((item: any, index: number) => (
                      <div 
                        key={item.id || index} 
                        className="border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName || item.name || 'نامشخص'}</p>
                            {item.productSku && (
                              <p className="text-xs text-muted-foreground">کد: {item.productSku}</p>
                            )}
                          </div>
                          {!hidePrice && item.totalPrice && (
                            <Badge variant="outline" className="font-semibold">
                              {formatPrice(item.totalPrice)} IQD
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">تعداد:</span>{' '}
                            {formatPrice(item.quantity)} {item.unit || 'عدد'}
                          </div>
                          {!hidePrice && item.unitPrice && (
                            <div>
                              <span className="font-medium">قیمت واحد:</span>{' '}
                              {formatPrice(item.unitPrice)} IQD
                            </div>
                          )}
                          {item.notes && (
                            <div className="col-span-2 md:col-span-3">
                              <span className="font-medium">توضیحات:</span> {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mr-6 bg-muted/30 p-4 rounded-lg">
                    اطلاعات اقلام در دسترس نیست
                  </p>
                )}
              </div>

              <Separator />

              {/* وزن و اطلاعات حمل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm bg-muted/30 p-3 rounded-lg">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">وزن ناخالص:</span>
                  <span className="text-muted-foreground">
                    {order.totalWeight || order.grossWeight 
                      ? `${formatPrice(order.totalWeight || order.grossWeight)} کیلوگرم` 
                      : 'وارد نشده'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-muted/30 p-3 rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">روش ارسال:</span>
                  <span className="text-muted-foreground">
                    {order.deliveryMethod === 'courier' ? 'پیک' : 
                     order.deliveryMethod === 'postal' ? 'پست' : 
                     order.deliveryMethod || 'نامشخص'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* نحوه تسویه */}
              <div className="flex items-center gap-2 text-sm bg-muted/30 p-3 rounded-lg">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">نحوه تسویه:</span>
                <Badge variant="outline">{translatePaymentMethod(order.paymentMethod)}</Badge>
              </div>

              {/* مبلغ کل - فقط اگر hidePrice نباشد */}
              {!hidePrice && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="font-semibold">مبلغ کل سفارش:</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(order.totalAmount)} IQD
                    </span>
                  </div>
                </>
              )}

              {/* وضعیت فعلی */}
              <div className="flex items-center gap-2 text-sm bg-muted/50 p-4 rounded-lg mt-4 border-t-2 border-primary/20">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">وضعیت فعلی:</span>
                <Badge variant={status === 'delivered' ? 'default' : 'secondary'} className="text-sm">
                  {translateStatus(status)}
                </Badge>
              </div>

              {/* یادداشت‌های اضافی */}
              {(order.financialNotes || order.warehouseNotes || order.deliveryNotes) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      یادداشت‌ها
                    </h4>
                    <div className="space-y-2 mr-6">
                      {order.financialNotes && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                            یادداشت مالی:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-300">{order.financialNotes}</p>
                        </div>
                      )}
                      {order.warehouseNotes && (
                        <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                          <p className="text-xs font-medium text-green-900 dark:text-green-200 mb-1">
                            یادداشت انبار:
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-300">{order.warehouseNotes}</p>
                        </div>
                      )}
                      {order.deliveryNotes && (
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                          <p className="text-xs font-medium text-purple-900 dark:text-purple-200 mb-1">
                            یادداشت ارسال:
                          </p>
                          <p className="text-sm text-purple-800 dark:text-purple-300">{order.deliveryNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

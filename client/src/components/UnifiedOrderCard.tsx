import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Clock
} from 'lucide-react';

interface OrderItem {
  id: number;
  productName: string;
  productSku?: string;
  quantity: string | number;
  unit?: string;
  unitPrice?: string | number;
  totalPrice?: string | number;
  notes?: string;
}

interface UnifiedOrderCardProps {
  order: {
    id?: number;
    orderNumber?: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: string;
    paymentMethod?: string;
    totalAmount?: string | number;
    status?: string;
    currentStatus?: string;
    createdAt?: string;
    grossWeight?: string | number;
    items?: OrderItem[];
  };
  hidePrice?: boolean; // برای بخش لجستیک
  language?: 'fa' | 'ar' | 'en';
}

export default function UnifiedOrderCard({ order, hidePrice = false, language = 'fa' }: UnifiedOrderCardProps) {
  // استخراج نام کامل مشتری
  const getCustomerName = () => {
    if (order.customerName) return order.customerName;
    if (order.customerFirstName || order.customerLastName) {
      return `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
    }
    return '';
  };

  // فرمت تاریخ
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
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
      return dateString;
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
    if (!method) return '';
    const translations: Record<string, string> = {
      'bank_transfer': 'انتقال بانکی',
      'wallet': 'کیف پول',
      'hybrid': 'ترکیبی (بانک + کیف پول)',
      'credit': 'مدت‌دار',
      'cash': 'نقدی',
      'card': 'کارت',
      'fib': 'درگاه FIB'
    };
    return translations[method] || method;
  };

  // ترجمه وضعیت
  const translateStatus = (status?: string) => {
    if (!status) return '';
    const translations: Record<string, string> = {
      'pending': 'در انتظار',
      'financial': 'بررسی مالی',
      'warehouse_pending': 'در انتظار انبار',
      'warehouse_processing': 'در حال پردازش در انبار',
      'ready_for_delivery': 'آماده ارسال',
      'in_transit': 'در حال ارسال',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده',
      'rejected': 'رد شده'
    };
    return translations[status] || status;
  };

  const customerName = getCustomerName();
  const status = order.currentStatus || order.status || '';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-4 w-4" />
            سفارش {order.orderNumber || '-'}
          </CardTitle>
          <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
            {translateStatus(status) || 'نامشخص'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* تاریخ و ساعت سفارش */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">تاریخ سفارش:</span>
          <span className="text-muted-foreground">
            {order.createdAt ? formatDate(order.createdAt) : 'نامشخص'}
          </span>
        </div>

        <Separator />

        {/* اطلاعات خریدار */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            اطلاعات خریدار
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mr-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">نام:</span>
              <span className="text-muted-foreground">{customerName || 'وارد نشده'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">تلفن:</span>
              <span className="text-muted-foreground" dir="ltr">{order.customerPhone || 'وارد نشده'}</span>
            </div>
            <div className="flex items-center gap-2 col-span-1 md:col-span-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">ایمیل:</span>
              <span className="text-muted-foreground" dir="ltr">{order.customerEmail || 'وارد نشده'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* آدرس پستی */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            آدرس تحویل
          </h4>
          <p className="text-sm text-muted-foreground mr-6">
            {order.shippingAddress || 'آدرس وارد نشده'}
          </p>
        </div>

        <Separator />

        {/* اقلام سفارش */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            اقلام سفارش
          </h4>
          {order.items && order.items.length > 0 ? (
            <div className="mr-6 space-y-2">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="text-sm border rounded-md p-3 bg-muted/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{item.productName || 'نامشخص'}</span>
                    {item.productSku && (
                      <span className="text-xs text-muted-foreground">SKU: {item.productSku}</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>تعداد: {formatPrice(item.quantity)} {item.unit || 'عدد'}</span>
                    {!hidePrice && item.unitPrice && (
                      <span>قیمت واحد: {formatPrice(item.unitPrice)} IQD</span>
                    )}
                    {!hidePrice && item.totalPrice && (
                      <span className="font-medium">جمع: {formatPrice(item.totalPrice)} IQD</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">توضیحات: {item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mr-6">اطلاعات اقلام موجود نیست</p>
          )}
        </div>

        <Separator />

        {/* وزن ناخالص */}
        <div className="flex items-center gap-2 text-sm">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">وزن ناخالص:</span>
          <span className="text-muted-foreground">
            {order.grossWeight ? `${formatPrice(order.grossWeight)} کیلوگرم` : 'وارد نشده'}
          </span>
        </div>

        <Separator />

        {/* نحوه تسویه */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">نحوه تسویه:</span>
          <span className="text-muted-foreground">
            {translatePaymentMethod(order.paymentMethod) || 'وارد نشده'}
          </span>
        </div>

        {/* مبلغ کل - فقط اگر hidePrice نباشد */}
        {!hidePrice && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">مبلغ کل:</span>
              <span className="text-lg font-bold text-primary">
                {order.totalAmount ? `${formatPrice(order.totalAmount)} IQD` : 'نامشخص'}
              </span>
            </div>
          </>
        )}

        {/* وضعیت فعلی */}
        <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-md mt-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">وضعیت فعلی:</span>
          <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
            {translateStatus(status) || 'نامشخص'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

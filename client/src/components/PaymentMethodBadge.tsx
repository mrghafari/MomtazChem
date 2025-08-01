import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, DollarSign, Clock, Building, AlertCircle } from 'lucide-react';

interface PaymentMethodBadgeProps {
  paymentMethod: string | undefined;
  totalAmount?: string;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
}

export default function PaymentMethodBadge({ 
  paymentMethod, 
  totalAmount, 
  currency = 'IQD', 
  size = 'md',
  showAmount = true 
}: PaymentMethodBadgeProps) {
  
  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case 'wallet_full':
        return {
          label: 'کیف پول (کامل)',
          description: 'پرداخت کامل از کیف پول',
          icon: <Wallet className="w-3 h-3" />,
          className: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'wallet_partial':
        return {
          label: 'ترکیبی',
          description: 'کیف پول + درگاه بانکی',
          icon: <DollarSign className="w-3 h-3" />,
          className: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      case 'bank_transfer_grace':
        return {
          label: 'مهلت‌دار',
          description: 'حواله بانکی 3 روزه',
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      case 'bank_gateway':
        return {
          label: 'درگاه بانکی',
          description: 'پرداخت آنلاین فوری',
          icon: <CreditCard className="w-3 h-3" />,
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'bank_transfer':
        return {
          label: 'حواله بانکی',
          description: 'انتقال مستقیم بانکی',
          icon: <Building className="w-3 h-3" />,
          className: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      case 'cash_on_delivery':
        return {
          label: 'پرداخت در محل',
          description: 'پرداخت هنگام تحویل',
          icon: <DollarSign className="w-3 h-3" />,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'company_credit':
        return {
          label: 'اعتبار شرکت',
          description: 'پرداخت از اعتبار شرکت',
          icon: <Building className="w-3 h-3" />,
          className: 'bg-cyan-100 text-cyan-800 border-cyan-300'
        };
      default:
        return {
          label: paymentMethod || 'نامشخص',
          description: 'نوع پرداخت تعریف نشده',
          icon: <AlertCircle className="w-3 h-3" />,
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const payment = getPaymentMethodDisplay();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className="space-y-1">
      <Badge 
        variant="outline" 
        className={`${payment.className} ${sizeClasses[size]} flex items-center gap-1 border`}
      >
        {payment.icon}
        {payment.label}
      </Badge>
      
      {size !== 'sm' && (
        <p className="text-xs text-gray-600">
          {payment.description}
        </p>
      )}
      
      {showAmount && totalAmount && (
        <p className="text-xs font-medium text-gray-700">
          💰 {totalAmount} {currency}
        </p>
      )}
    </div>
  );
}
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, DollarSign, Clock, AlertTriangle } from 'lucide-react';

interface PaymentMethodBadgeProps {
  paymentMethod?: string | null;
  className?: string;
  showIcon?: boolean;
}

const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({ 
  paymentMethod, 
  className = "",
  showIcon = true 
}) => {
  const getPaymentMethodInfo = (method?: string | null) => {
    // 🚨 CRITICAL: Never use fallback - always show actual payment method from database
    if (!method || method === null || method === undefined) {
      console.warn('⚠️ [PAYMENT METHOD] Missing payment method data - this should not happen!', { method });
      return {
        label: 'داده نامعلوم',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
      };
    }

    switch (method.toLowerCase()) {
      case 'wallet_full':
        return {
          label: 'کیف پول (کامل)',
          variant: 'default' as const,
          icon: Wallet,
          className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'
        };
      
      case 'wallet_partial':
        return {
          label: 'کیف پول (جزئی)',
          variant: 'outline' as const,
          icon: Wallet,
          className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-300'
        };
      
      case 'online_payment':
        return {
          label: 'پرداخت آنلاین',
          variant: 'default' as const,
          icon: CreditCard,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
        };
      
      case 'bank_transfer':
        return {
          label: 'انتقال بانکی',
          variant: 'outline' as const,
          icon: DollarSign,
          className: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-300'
        };
      
      case 'bank_transfer_grace':
        return {
          label: 'انتقال بانکی (دوره مهلت)',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-300'
        };
      
      case 'hybrid':
        return {
          label: 'ترکیبی (کیف پول + بانک)',
          variant: 'outline' as const,
          icon: DollarSign,
          className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-300'
        };
      
      case 'cash':
        return {
          label: 'نقدی',
          variant: 'secondary' as const,
          icon: DollarSign,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
        };
      
      case 'credit':
        return {
          label: 'اعتباری',
          variant: 'outline' as const,
          icon: CreditCard,
          className: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300'
        };
      
      default:
        return {
          label: method,
          variant: 'secondary' as const,
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        };
    }
  };

  const paymentInfo = getPaymentMethodInfo(paymentMethod);
  const IconComponent = paymentInfo.icon;

  return (
    <Badge 
      variant={paymentInfo.variant}
      className={`${paymentInfo.className} ${className} flex items-center gap-1 text-xs font-medium`}
    >
      {showIcon && <IconComponent className="w-3 h-3" />}
      {paymentInfo.label}
    </Badge>
  );
};

export default PaymentMethodBadge;
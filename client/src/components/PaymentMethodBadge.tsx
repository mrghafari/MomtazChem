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

    // 🚨 6-METHOD ORDERING SYSTEM - Only supported payment methods
    switch (method.toLowerCase()) {
      // Method 1: Full Wallet Payment
      case 'wallet_full':
        return {
          label: 'کیف پول (کامل)',
          variant: 'default' as const,
          icon: Wallet,
          className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'
        };
      
      // Method 2: Hybrid Payment (wallet + bank)
      case 'wallet_partial':
        return {
          label: 'کیف پول (ترکیبی)',
          variant: 'outline' as const,
          icon: Wallet,
          className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-300'
        };
      
      // Method 3: Online Payment Gateway
      case 'online_payment':
        return {
          label: 'پرداخت آنلاین',
          variant: 'default' as const,
          icon: CreditCard,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
        };
      
      // Method 5: Bank Transfer with Grace Period
      case 'bank_transfer_grace':
        return {
          label: 'انتقال بانکی (3 روز مهلت)',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-300'
        };
      
      // Method 6: Bank Gateway Payment
      case 'bank_gateway':
        return {
          label: 'درگاه بانکی',
          variant: 'default' as const,
          icon: CreditCard,
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300'
        };
      
      // Legacy/Unknown methods - should not appear in 6-method system
      default:
        console.warn('⚠️ [6-METHOD] Unsupported payment method detected:', method);
        return {
          label: `نامشخص (${method})`,
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-600 hover:bg-red-200 border-red-300'
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
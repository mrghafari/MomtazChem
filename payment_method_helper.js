// Helper function to translate payment method for print templates
const getPaymentMethodText = (paymentMethod) => {
  switch (paymentMethod) {
    case 'wallet_full': return 'کیف پول کامل';
    case 'bank_transfer': return 'واریز بانکی';
    case 'bank_transfer_grace': return 'واریز بانکی (مهلت‌دار)';
    case 'online_payment': return 'درگاه آنلاین';
    case 'digital_wallet': return 'کیف پول دیجیتال';
    case 'iraqi_bank_gateway': return 'درگاه بانکی عراقی';
    case 'cash': return 'نقدی';
    case 'credit': return 'اعتباری';
    default: return paymentMethod || 'نامشخص';
  }
};

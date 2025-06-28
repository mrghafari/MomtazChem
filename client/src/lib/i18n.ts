export type Language = 'en' | 'ar' | 'ku';

export interface Translation {
  // Navigation
  home: string;
  about: string;
  services: string;
  products: string;
  contact: string;
  shop: string;
  
  // Common actions
  login: string;
  logout: string;
  register: string;
  submit: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  search: string;
  loading: string;
  
  // Product related
  addToCart: string;
  viewDetails: string;
  price: string;
  quantity: string;
  category: string;
  inStock: string;
  outOfStock: string;
  
  // Cart and checkout
  cart: string;
  checkout: string;
  total: string;
  subtotal: string;
  shipping: string;
  orderSummary: string;
  placeOrder: string;
  
  // User account
  myAccount: string;
  myOrders: string;
  profile: string;
  wallet: string;
  orderHistory: string;
  
  // Wallet specific
  walletTitle: string;
  walletSubtitle: string;
  currentBalance: string;
  creditLimit: string;
  status: string;
  lastActivity: string;
  addFunds: string;
  transactions: string;
  rechargeRequests: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
  pending: string;
  completed: string;
  rejected: string;
  active: string;
  inactive: string;
  credit: string;
  debit: string;
  type: string;
  description: string;
  date: string;
  requestNumber: string;
  totalSpent: string;
  totalRecharged: string;
  noTransactions: string;
  noRechargeRequests: string;
  rechargeSuccess: string;
  optional: string;
  bankTransfer: string;
  onlinePayment: string;
  cashPayment: string;
  mobileWallet: string;
  processing: string;
  allTransactions: string;
  recentTransactions: string;
  quickActions: string;
  manageWallet: string;
  walletRechargeRequest: string;
  fillRechargeDetails: string;
  enterAmount: string;
  selectPaymentMethod: string;
  iraqiDinar: string;
  usDollar: string;
  euro: string;
  enterPaymentReference: string;
  enterNotes: string;
  inputError: string;
  validAmount: string;
  requestError: string;
  errorCreatingRequest: string;
  loginToAccessWallet: string;
  goToLogin: string;
  totalWithdrawals: string;
  totalDeposits: string;
  requestSubmitted: string;
  requestPendingApproval: string;
  
  // Forms
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  company: string;
  
  // Messages
  welcomeMessage: string;
  thankYou: string;
  orderConfirmed: string;
  contactSuccess: string;
  
  // Product categories
  waterTreatment: string;
  fuelAdditives: string;
  paintThinner: string;
  agriculturalFertilizers: string;
  
  // Footer
  aboutCompany: string;
  contactInfo: string;
  followUs: string;
  allRightsReserved: string;
}

export const translations: Record<Language, Translation> = {
  
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    services: 'Services',
    products: 'Products',
    contact: 'Contact',
    shop: 'Shop',
    
    // Common actions
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    loading: 'Loading...',
    
    // Product related
    addToCart: 'Add to Cart',
    viewDetails: 'View Details',
    price: 'Price',
    quantity: 'Quantity',
    category: 'Category',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    
    // Cart and checkout
    cart: 'Cart',
    checkout: 'Checkout',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    orderSummary: 'Order Summary',
    placeOrder: 'Place Order',
    
    // User account
    myAccount: 'My Account',
    myOrders: 'My Orders',
    profile: 'Profile',
    wallet: 'Wallet',
    orderHistory: 'Order History',
    
    // Wallet specific
    walletTitle: 'Customer Wallet',
    walletSubtitle: 'Manage your account balance and transactions',
    currentBalance: 'Current Balance',
    creditLimit: 'Credit Limit',
    status: 'Status',
    lastActivity: 'Last Activity',
    addFunds: 'Add Funds',
    transactions: 'Transactions',
    rechargeRequests: 'Recharge Requests',
    amount: 'Amount',
    currency: 'Currency',
    paymentMethod: 'Payment Method',
    paymentReference: 'Payment Reference',
    notes: 'Notes',
    pending: 'Pending',
    completed: 'Completed',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    credit: 'Credit',
    debit: 'Debit',
    type: 'Type',
    description: 'Description',
    date: 'Date',
    requestNumber: 'Request #',
    totalSpent: 'Total Spent',
    totalRecharged: 'Total Recharged',
    noTransactions: 'No transactions found',
    noRechargeRequests: 'No recharge requests found',
    rechargeSuccess: 'Recharge request submitted successfully',
    optional: 'Optional',
    bankTransfer: 'Bank Transfer',
    onlinePayment: 'Online Payment',
    cashPayment: 'Cash Payment',
    mobileWallet: 'Mobile Wallet',
    processing: 'Processing...',
    allTransactions: 'All Transactions',
    recentTransactions: 'Recent Transactions',
    quickActions: 'Quick Actions',
    manageWallet: 'Manage your wallet',
    walletRechargeRequest: 'Wallet Recharge Request',
    fillRechargeDetails: 'Fill in the details below to request a wallet recharge',
    enterAmount: 'Enter amount',
    selectPaymentMethod: 'Select payment method',
    iraqiDinar: 'Iraqi Dinar (IQD)',
    usDollar: 'US Dollar (USD)',
    euro: 'Euro (EUR)',
    enterPaymentReference: 'Enter payment reference (optional)',
    enterNotes: 'Enter notes (optional)',
    inputError: 'Input Error',
    validAmount: 'Please enter a valid amount',
    requestError: 'Request Error',
    errorCreatingRequest: 'Error creating wallet recharge request',
    loginToAccessWallet: 'Please log in to access your wallet',
    goToLogin: 'Go to Login',
    totalWithdrawals: 'Total withdrawals',
    totalDeposits: 'Total deposits',
    requestSubmitted: 'Your wallet recharge request has been submitted successfully and is pending approval.',
    requestPendingApproval: 'Request pending approval',
    
    // Forms
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    country: 'Country',
    company: 'Company',
    
    // Messages
    welcomeMessage: 'Welcome to Momtazchem',
    thankYou: 'Thank You',
    orderConfirmed: 'Your order has been confirmed',
    contactSuccess: 'Your message has been sent successfully',
    
    // Product categories
    waterTreatment: 'Water Treatment',
    fuelAdditives: 'Fuel Additives',
    paintThinner: 'Paint & Thinner',
    agriculturalFertilizers: 'Agricultural Fertilizers',
    
    // Footer
    aboutCompany: 'About Company',
    contactInfo: 'Contact Information',
    followUs: 'Follow Us',
    allRightsReserved: 'All Rights Reserved',
  },
  
  ar: {
    // Navigation
    home: 'الرئيسية',
    about: 'حولنا',
    services: 'الخدمات',
    products: 'المنتجات',
    contact: 'اتصل بنا',
    shop: 'المتجر',
    
    // Common actions
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    register: 'إنشاء حساب',
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    edit: 'تحرير',
    delete: 'حذف',
    search: 'بحث',
    loading: 'جاري التحميل...',
    
    // Product related
    addToCart: 'أضف إلى السلة',
    viewDetails: 'عرض التفاصيل',
    price: 'السعر',
    quantity: 'الكمية',
    category: 'الفئة',
    inStock: 'متوفر',
    outOfStock: 'غير متوفر',
    
    // Cart and checkout
    cart: 'السلة',
    checkout: 'الدفع',
    total: 'المجموع',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    orderSummary: 'ملخص الطلب',
    placeOrder: 'تأكيد الطلب',
    
    // User account
    myAccount: 'حسابي',
    myOrders: 'طلباتي',
    profile: 'الملف الشخصي',
    wallet: 'المحفظة',
    orderHistory: 'تاريخ الطلبات',
    
    // Wallet specific
    walletTitle: 'محفظة العميل',
    walletSubtitle: 'إدارة رصيد حسابك والمعاملات',
    currentBalance: 'الرصيد الحالي',
    creditLimit: 'الحد الائتماني',
    status: 'الحالة',
    lastActivity: 'آخر نشاط',
    addFunds: 'إضافة أموال',
    transactions: 'المعاملات',
    rechargeRequests: 'طلبات الشحن',
    amount: 'المبلغ',
    currency: 'العملة',
    paymentMethod: 'طريقة الدفع',
    paymentReference: 'مرجع الدفع',
    notes: 'ملاحظات',
    pending: 'معلق',
    completed: 'مكتمل',
    rejected: 'مرفوض',
    active: 'نشط',
    inactive: 'غير نشط',
    credit: 'إيداع',
    debit: 'سحب',
    type: 'النوع',
    description: 'الوصف',
    date: 'التاريخ',
    requestNumber: 'رقم الطلب',
    totalSpent: 'إجمالي الإنفاق',
    totalRecharged: 'إجمالي الشحن',
    noTransactions: 'لا توجد معاملات',
    noRechargeRequests: 'لا توجد طلبات شحن',
    rechargeSuccess: 'تم إرسال طلب الشحن بنجاح',
    optional: 'اختياري',
    bankTransfer: 'تحويل بنكي',
    onlinePayment: 'دفع إلكتروني',
    cashPayment: 'دفع نقدي',
    mobileWallet: 'محفظة الهاتف',
    processing: 'جاري المعالجة...',
    allTransactions: 'جميع المعاملات',
    recentTransactions: 'المعاملات الأخيرة',
    quickActions: 'الإجراءات السريعة',
    manageWallet: 'إدارة محفظتك',
    walletRechargeRequest: 'طلب شحن المحفظة',
    fillRechargeDetails: 'املأ التفاصيل أدناه لطلب شحن المحفظة',
    enterAmount: 'أدخل المبلغ',
    selectPaymentMethod: 'اختر طريقة الدفع',
    iraqiDinar: 'الدينار العراقي (IQD)',
    usDollar: 'الدولار الأمريكي (USD)',
    euro: 'اليورو (EUR)',
    enterPaymentReference: 'أدخل مرجع الدفع (اختياري)',
    enterNotes: 'أدخل ملاحظات (اختياري)',
    inputError: 'خطأ في الإدخال',
    validAmount: 'يرجى إدخال مبلغ صحيح',
    requestError: 'خطأ في الطلب',
    errorCreatingRequest: 'خطأ في إنشاء طلب شحن المحفظة',
    loginToAccessWallet: 'يرجى تسجيل الدخول للوصول إلى محفظتك',
    goToLogin: 'الذهاب إلى تسجيل الدخول',
    totalWithdrawals: 'إجمالي السحوبات',
    totalDeposits: 'إجمالي الإيداعات',
    requestSubmitted: 'تم إرسال طلب شحن محفظتك بنجاح وهو في انتظار الموافقة.',
    requestPendingApproval: 'الطلب في انتظار الموافقة',
    
    // Forms
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    city: 'المدينة',
    country: 'البلد',
    company: 'الشركة',
    
    // Messages
    welcomeMessage: 'مرحباً بكم في مجمع ممتاز الكيميائي',
    thankYou: 'شكراً لكم',
    orderConfirmed: 'تم تأكيد طلبكم',
    contactSuccess: 'تم إرسال رسالتكم بنجاح',
    
    // Product categories
    waterTreatment: 'معالجة المياه',
    fuelAdditives: 'إضافات الوقود',
    paintThinner: 'الدهان والمذيبات',
    agriculturalFertilizers: 'الأسمدة الزراعية',
    
    // Footer
    aboutCompany: 'حول الشركة',
    contactInfo: 'معلومات الاتصال',
    followUs: 'تابعونا',
    allRightsReserved: 'جميع الحقوق محفوظة',
  },

  ku: {
    // Navigation
    home: 'ماڵەوە',
    about: 'دەربارەمان',
    services: 'خزمەتگوزاریەکان',
    products: 'بەرهەمەکان',
    contact: 'پەیوەندی',
    shop: 'فرۆشگا',
    
    // Common actions
    login: 'چوونەژوورەوە',
    logout: 'چوونەدەرەوە',
    register: 'تۆمارکردن',
    submit: 'ناردن',
    cancel: 'هەڵوەشاندنەوە',
    save: 'پاشکەوتکردن',
    edit: 'دەستکاریکردن',
    delete: 'سڕینەوە',
    search: 'گەڕان',
    loading: 'باربوون...',
    
    // Product related
    addToCart: 'زیادکردن بۆ سەبەتە',
    viewDetails: 'بینینی وردەکاریەکان',
    price: 'نرخ',
    quantity: 'ڕێژە',
    category: 'بەش',
    inStock: 'لە کۆگادا هەیە',
    outOfStock: 'لە کۆگادا نییە',
    
    // Cart and checkout
    cart: 'سەبەتە',
    checkout: 'پارەدان',
    total: 'کۆی گشتی',
    subtotal: 'کۆی بەشی',
    shipping: 'گەیاندن',
    orderSummary: 'پوختەی داواکاری',
    placeOrder: 'جێبەجێکردنی داواکاری',
    
    // User account
    myAccount: 'هەژمارەکەم',
    myOrders: 'داواکاریەکانم',
    profile: 'پرۆفایل',
    wallet: 'جزدان',
    orderHistory: 'مێژووی داواکاریەکان',
    
    // Wallet specific
    walletTitle: 'جزدانی کڕیار',
    walletSubtitle: 'بەڕێوەبردنی باڵانسی هەژمارەکەت و مامەڵەکان',
    currentBalance: 'باڵانسی ئێستا',
    creditLimit: 'سنووری قەرز',
    status: 'دۆخ',
    lastActivity: 'دوایین چالاکی',
    addFunds: 'زیادکردنی پارە',
    transactions: 'مامەڵەکان',
    rechargeRequests: 'داواکاریەکانی پڕکردنەوە',
    amount: 'بڕ',
    currency: 'دراو',
    paymentMethod: 'شێوازی پارەدان',
    paymentReference: 'ژمارەی پارەدان',
    notes: 'تێبینیەکان',
    pending: 'چاوەڕێ',
    completed: 'تەواوبوو',
    rejected: 'ڕەتکراوە',
    active: 'چالاک',
    inactive: 'ناچالاک',
    credit: 'خستنەژوورەوە',
    debit: 'دەرهێنان',
    type: 'جۆر',
    description: 'وەسف',
    date: 'بەروار',
    requestNumber: 'ژمارەی داواکاری',
    totalSpent: 'کۆی خەرجکراو',
    totalRecharged: 'کۆی پڕکراوەتەوە',
    noTransactions: 'هیچ مامەڵەیەک نەدۆزرایەوە',
    noRechargeRequests: 'هیچ داواکاریەکی پڕکردنەوە نەدۆزرایەوە',
    rechargeSuccess: 'داواکاریەکەی پڕکردنەوە بە سەرکەوتووی نێردرا',
    optional: 'ئارەزووی',
    bankTransfer: 'گواستنەوەی بانکی',
    onlinePayment: 'پارەدانی ئۆنلاین',
    cashPayment: 'پارەدانی نەقدی',
    mobileWallet: 'جزدانی مۆبایل',
    processing: 'پرۆسەکردن...',
    allTransactions: 'هەموو مامەڵەکان',
    recentTransactions: 'مامەڵە نوێکان',
    quickActions: 'کردارە خێراکان',
    manageWallet: 'بەڕێوەبردنی جزدانەکەت',
    walletRechargeRequest: 'داواکاریەکەی پڕکردنەوەی جزدان',
    fillRechargeDetails: 'وردەکاریەکان پڕ بکەرەوە بۆ داواکردنی پڕکردنەوەی جزدان',
    enterAmount: 'بڕەکە بنووسە',
    selectPaymentMethod: 'شێوازی پارەدان هەڵبژێرە',
    iraqiDinar: 'دیناری عێراقی (IQD)',
    usDollar: 'دۆلاری ئەمریکی (USD)',
    euro: 'یۆرۆ (EUR)',
    enterPaymentReference: 'ژمارەی پارەدان بنووسە (ئارەزووی)',
    enterNotes: 'تێبینیەکان بنووسە (ئارەزووی)',
    inputError: 'هەڵەی نووسین',
    validAmount: 'تکایە بڕێکی درووست بنووسە',
    requestError: 'هەڵەی داواکاری',
    errorCreatingRequest: 'هەڵە لە دروستکردنی داواکاریەکەی پڕکردنەوەی جزدان',
    loginToAccessWallet: 'تکایە بچۆ ژوورەوە بۆ دەستپێگەیشتن بە جزدانەکەت',
    goToLogin: 'بڕۆ بۆ چوونە ژوورەوە',
    totalWithdrawals: 'کۆی دەرهێنراوەکان',
    totalDeposits: 'کۆی خراوەتە ژوورەوەکان',
    requestSubmitted: 'داواکاریەکەی پڕکردنەوەی جزدانەکەت بە سەرکەوتووی نێردرا و چاوەڕێی پەسەندکردنە.',
    requestPendingApproval: 'داواکاری چاوەڕێی پەسەندکردنە',
    
    // Forms
    firstName: 'ناوی یەکەم',
    lastName: 'ناوی دواین',
    email: 'ئیمەیل',
    phone: 'تەلەفۆن',
    address: 'ناونیشان',
    city: 'شار',
    country: 'وڵات',
    company: 'کۆمپانیا',
    
    // Messages
    welcomeMessage: 'بەخێربێن بۆ مەجمەعی ممتاز الکیمیائی',
    thankYou: 'سوپاستان',
    orderConfirmed: 'داواکاریەکەتان پەسەندکرا',
    contactSuccess: 'پەیامەکەتان بە سەرکەوتووی نێردرا',
    
    // Product categories
    waterTreatment: 'چارەسەری ئاو',
    fuelAdditives: 'زیادکەرەکانی سووتەمەنی',
    paintThinner: 'بۆیە و تیننەر',
    agriculturalFertilizers: 'پەینی کشتوکاڵی',
    
    // Footer
    aboutCompany: 'دەربارەی کۆمپانیا',
    contactInfo: 'زانیاریەکانی پەیوەندی',
    followUs: 'شوێنمان بکەون',
    allRightsReserved: 'هەموو مافەکان پارێزراون',
  },
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'en' ? 'ltr' : 'rtl';
};

export const getLanguageName = (language: Language): string => {
  const names = {
    en: 'English',
    ar: 'العربية',
    ku: 'کوردی'
  };
  return names[language];
};
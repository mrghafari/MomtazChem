export type Language = 'en' | 'ar' | 'ku' | 'tr';

export interface Translation {
  // Navigation
  home: string;
  about: string;
  services: string;
  products: string;
  contact: string;
  shop: {
    title: string;
    lowStockWarning: string;
    priceFilter: string;
    minPrice: string;
    maxPrice: string;
  };
  
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
  
  // Customer Profile
  welcomeCustomer: string;
  customerProfile: string;
  manageAccount: string;
  editProfile: string;
  continueShopping: string;
  accountInformation: string;
  fullName: string;
  contactDetails: string;
  orderNumber: string;
  totalAmount: string;
  noOrders: string;
  viewOrder: string;
  orderDate: string;
  orderStatus: string;
  confirmed: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  logoutSuccessful: string;
  logoutSuccessfulDesc: string;
  logoutError: string;
  error: string;
  
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
  
  // Notifications and Toast Messages
  success: string;
  errorOccurred: string;
  warning: string;
  info: string;
  loginSuccessful: string;
  loginFailed: string;
  registrationSuccessful: string;
  registrationFailed: string;
  orderCreated: string;
  orderFailed: string;
  addedToCart: string;
  removedFromCart: string;
  cartCleared: string;
  profileUpdated: string;
  profileUpdateFailed: string;
  passwordChanged: string;
  passwordChangeFailed: string;
  emailSent: string;
  emailFailed: string;
  dataLoaded: string;
  dataLoadFailed: string;
  unauthorized: string;
  unauthorizedDesc: string;
  productNotFound: string;
  networkError: string;
  tryAgain: string;
  pleaseWait: string;
  
  // Product categories
  waterTreatment: string;
  fuelAdditives: string;
  paintThinner: string;
  agriculturalFertilizers: string;
  
  // Product Reviews
  productReviews: string;
  customerReviews: string;
  addYourReview: string;
  writeReview: string;
  rating: string;
  comment: string;
  customerName: string;
  submitReview: string;
  reviewSubmitted: string;
  reviewSubmittedDesc: string;
  reviewError: string;
  reviewErrorDesc: string;
  backToShop: string;
  averageRating: string;
  totalReviews: string;
  noReviewsYet: string;
  noReviewsDesc: string;
  reviewsAndRatings: string;
  customerFeedback: string;
  
  // Footer
  aboutCompany: string;
  contactInfo: string;
  followUs: string;
  allRightsReserved: string;
  
  // About page
  aboutTitle: string;
  aboutSubtitle: string;
  ourStory: string;
  ourMission: string;
  ourVision: string;
  ourCoreValues: string;
  valuesSubtitle: string;
  ourTeamExpertise: string;
  certificationsCompliance: string;
  certificationsSubtitle: string;
  
  // About content
  storyParagraph1: string;
  storyParagraph2: string;
  storyParagraph3: string;
  missionText: string;
  visionText: string;
  teamText: string;
  
  // Values
  qualityExcellence: string;
  qualityExcellenceDesc: string;
  environmentalResponsibility: string;
  environmentalResponsibilityDesc: string;
  customerFocus: string;
  customerFocusDesc: string;
  globalReach: string;
  globalReachDesc: string;
  
  // Stats
  employees: string;
  rdScientists: string;
  manufacturingSites: string;
  qualityRate: string;
  
  // Product Form
  productManagement: string;
  addProduct: string;
  editProduct: string;
  productName: string;
  shortDescription: string;
  productDescription: string;
  priceRange: string;
  productCategory: string;
  productSpecifications: string;
  productFeatures: string;
  productApplications: string;
  productTags: string;
  productImage: string;
  productCatalog: string;
  msdsDocument: string;
  stockQuantity: string;
  minStockLevel: string;
  maxStockLevel: string;
  unitPrice: string;
  netWeight: string;
  grossWeight: string;
  weightUnit: string;
  batchNumber: string;
  productSku: string;
  productBarcode: string;
  isVariant: string;
  parentProduct: string;
  variantType: string;
  variantValue: string;
  syncWithShop: string;
  showWhenOutOfStock: string;
  showCatalogToCustomers: string;
  showMsdsToCustomers: string;
  basicInfo: string;
  pricingInventory: string;
  documentsMedia: string;
  variantSettings: string;
  shopSettings: string;
  weightsAndBatch: string;
  productDetails: string;
}

export const translations: Record<Language, Translation> = {
  
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    services: 'Services',
    products: 'Products',
    contact: 'Contact',
    shop: {
      title: 'Shop',
      lowStockWarning: 'Only {count} items left!',
      priceFilter: 'Price Filter',
      minPrice: 'Min',
      maxPrice: 'Max'
    },
    
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
    bankReference: 'Bank Reference Number',
    enterBankReference: 'Enter bank reference number',
    bankReceipt: 'Bank Receipt',
    uploadBankReceipt: 'Upload bank receipt (JPG, PNG, PDF)',
    bankReceiptRequired: 'Bank receipt is required for bank transfer',
    bankReferenceRequired: 'Bank reference number is required for bank transfer',
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
    
    // Customer Profile
    welcomeCustomer: 'Welcome',
    customerProfile: 'Customer Profile',
    manageAccount: 'Manage your account and view order history',
    editProfile: 'Edit Profile',
    continueShopping: 'Continue Shopping',
    accountInformation: 'Account Information',
    fullName: 'Full Name',
    contactDetails: 'Contact Details',
    orderNumber: 'Order Number',
    totalAmount: 'Total Amount',
    noOrders: 'No orders found',
    viewOrder: 'View Order',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    logoutSuccessful: 'Logout Successful',
    logoutSuccessfulDesc: 'You have been logged out successfully',
    logoutError: 'An error occurred during logout',
    error: 'Error',
    
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
    
    // Notifications and Toast Messages
    success: 'Success',
    errorOccurred: 'Error Occurred',
    warning: 'Warning',
    info: 'Information',
    loginSuccessful: 'Login Successful',
    loginFailed: 'Login Failed',
    registrationSuccessful: 'Registration Successful',
    registrationFailed: 'Registration Failed',
    orderCreated: 'Order Created Successfully',
    orderFailed: 'Order Creation Failed',
    addedToCart: 'Product Added to Cart',
    removedFromCart: 'Product Removed from Cart',
    cartCleared: 'Cart Cleared',
    profileUpdated: 'Profile Updated Successfully',
    profileUpdateFailed: 'Profile Update Failed',
    passwordChanged: 'Password Changed Successfully',
    passwordChangeFailed: 'Password Change Failed',
    emailSent: 'Email Sent Successfully',
    emailFailed: 'Email Sending Failed',
    dataLoaded: 'Data Loaded Successfully',
    dataLoadFailed: 'Data Loading Failed',
    unauthorized: 'Unauthorized',
    unauthorizedDesc: 'You are logged out. Logging in again...',
    productNotFound: 'Product Not Found',
    networkError: 'Network Error',
    tryAgain: 'Please try again',
    pleaseWait: 'Please wait...',
    
    // Product categories
    waterTreatment: 'Water Treatment',
    fuelAdditives: 'Fuel Additives',
    paintThinner: 'Paint & Thinner',
    agriculturalFertilizers: 'Agricultural Fertilizers',
    
    // Product Reviews
    productReviews: 'Product Reviews',
    customerReviews: 'Customer Reviews',
    addYourReview: 'Add Your Review',
    writeReview: 'Write Review',
    rating: 'Rating',
    comment: 'Comment',
    customerName: 'Customer Name',
    submitReview: 'Submit Review',
    reviewSubmitted: 'Success',
    reviewSubmittedDesc: 'Your review has been submitted successfully',
    reviewError: 'Error',
    reviewErrorDesc: 'Error submitting review',
    backToShop: 'Back to Shop',
    averageRating: 'Average Rating',
    totalReviews: 'Total Reviews',
    noReviewsYet: 'No Reviews Yet',
    noReviewsDesc: 'Be the first to review this product',
    reviewsAndRatings: 'Reviews & Ratings',
    customerFeedback: 'Customer Feedback',
    
    // Footer
    aboutCompany: 'About Company',
    contactInfo: 'Contact Information',
    followUs: 'Follow Us',
    allRightsReserved: 'All Rights Reserved',
    
    // About page
    aboutTitle: 'About Momtazchem',
    aboutSubtitle: 'Leading the chemical industry with innovation, quality, and sustainability for over 25 years.',
    ourStory: 'Our Story',
    ourMission: 'Our Mission',
    ourVision: 'Our Vision',
    ourCoreValues: 'Our Core Values',
    valuesSubtitle: 'The principles that guide our decisions and shape our culture every day.',
    ourTeamExpertise: 'Our Team & Expertise',
    certificationsCompliance: 'Certifications & Compliance',
    certificationsSubtitle: 'We maintain the highest industry standards and certifications to ensure quality, safety, and environmental responsibility.',
    
    // About content
    storyParagraph1: 'Founded in 1999, Momtazchem began as a small chemical manufacturing company with a vision to provide high-quality chemical solutions to industries worldwide. Over the past 25 years, we have grown into a leading manufacturer serving four key market segments.',
    storyParagraph2: 'Our journey has been marked by continuous innovation, strategic expansion, and an unwavering commitment to quality. Today, we operate state-of-the-art manufacturing facilities and serve customers in over 40 countries across the globe.',
    storyParagraph3: 'As we look to the future, we remain dedicated to advancing chemical science, supporting our customers\' success, and contributing to a more sustainable world.',
    missionText: 'To develop and manufacture innovative chemical solutions that enhance industrial processes, improve product performance, and contribute to sustainable development while maintaining the highest standards of quality and safety.',
    visionText: 'To be the world\'s most trusted partner in chemical solutions, recognized for our innovation, sustainability, and commitment to advancing industries while protecting the environment for future generations.',
    teamText: 'Our success is built on the expertise and dedication of our team. We employ over 500 professionals, including chemical engineers, research scientists, quality specialists, and industry experts.',
    
    // Values
    qualityExcellence: 'Quality Excellence',
    qualityExcellenceDesc: 'We maintain the highest standards in all our products and processes, with ISO certifications ensuring consistent quality.',
    environmentalResponsibility: 'Environmental Responsibility',
    environmentalResponsibilityDesc: 'Committed to sustainable manufacturing practices and developing eco-friendly chemical solutions.',
    customerFocus: 'Customer Focus',
    customerFocusDesc: 'Our customers\' success is our priority. We provide tailored solutions and exceptional service.',
    globalReach: 'Global Reach',
    globalReachDesc: 'Serving customers in over 40 countries with reliable supply chains and local support.',
    
    // Stats
    employees: 'Employees',
    rdScientists: 'R&D Scientists',
    manufacturingSites: 'Manufacturing Sites',
    qualityRate: 'Quality Rate',
    
    // Product Form
    productManagement: 'Product Management',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    shortDescription: 'Short Description',
    productDescription: 'Product Description',
    priceRange: 'Price Range',
    productCategory: 'Product Category',
    productSpecifications: 'Product Specifications',
    productFeatures: 'Product Features',
    productApplications: 'Product Applications',
    productTags: 'Product Tags',
    productImage: 'Product Image',
    productCatalog: 'Product Catalog',
    msdsDocument: 'MSDS Document',
    stockQuantity: 'Stock Quantity',
    minStockLevel: 'Minimum Stock Level',
    maxStockLevel: 'Maximum Stock Level',
    unitPrice: 'Unit Price',
    netWeight: 'Net Weight',
    grossWeight: 'Gross Weight',
    weightUnit: 'Weight Unit',
    batchNumber: 'Batch Number',
    productSku: 'Product SKU',
    productBarcode: 'Product Barcode',
    isVariant: 'Is Product Variant',
    parentProduct: 'Parent Product',
    variantType: 'Variant Type',
    variantValue: 'Variant Value',
    syncWithShop: 'Sync with Shop',
    showWhenOutOfStock: 'Show When Out of Stock',
    showCatalogToCustomers: 'Show Catalog to Customers',
    showMsdsToCustomers: 'Show MSDS to Customers',
    basicInfo: 'Basic Information',
    pricingInventory: 'Pricing & Inventory',
    documentsMedia: 'Documents & Media',
    variantSettings: 'Variant Settings',
    shopSettings: 'Shop Settings',
    weightsAndBatch: 'Weights & Batch',
    productDetails: 'Product Details',
  },
  
  ar: {
    // Navigation
    home: 'الرئيسية',
    about: 'حولنا',
    services: 'الخدمات',
    products: 'المنتجات',
    contact: 'اتصل بنا',
    shop: {
      title: 'المتجر',
      lowStockWarning: 'لم يتبق سوى {count} قطعة!',
      priceFilter: 'فلتر السعر',
      minPrice: 'الحد الأدنى',
      maxPrice: 'الحد الأقصى'
    },
    
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
    bankReference: 'رقم مرجع البنك',
    enterBankReference: 'أدخل رقم مرجع البنك',
    bankReceipt: 'إيصال البنك',
    uploadBankReceipt: 'رفع إيصال البنك (JPG, PNG, PDF)',
    bankReceiptRequired: 'إيصال البنك مطلوب للتحويل البنكي',
    bankReferenceRequired: 'رقم مرجع البنك مطلوب للتحويل البنكي',
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
    
    // Customer Profile
    welcomeCustomer: 'مرحباً',
    customerProfile: 'الملف الشخصي للعميل',
    manageAccount: 'إدارة حسابك وعرض تاريخ الطلبات',
    editProfile: 'تحرير الملف الشخصي',
    continueShopping: 'متابعة التسوق',
    accountInformation: 'معلومات الحساب',
    fullName: 'الاسم الكامل',
    contactDetails: 'تفاصيل الاتصال',
    orderNumber: 'رقم الطلب',
    totalAmount: 'المبلغ الإجمالي',
    noOrders: 'لا توجد طلبات',
    viewOrder: 'عرض الطلب',
    orderDate: 'تاريخ الطلب',
    orderStatus: 'حالة الطلب',
    confirmed: 'مؤكد',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    logoutSuccessful: 'تم تسجيل الخروج بنجاح',
    logoutSuccessfulDesc: 'تم تسجيل خروجك بنجاح',
    logoutError: 'حدث خطأ أثناء تسجيل الخروج',
    error: 'خطأ',
    
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
    
    // Notifications and Toast Messages
    success: 'نجح',
    errorOccurred: 'حدث خطأ',
    warning: 'تحذير',
    info: 'معلومات',
    loginSuccessful: 'تم تسجيل الدخول بنجاح',
    loginFailed: 'فشل تسجيل الدخول',
    registrationSuccessful: 'تم التسجيل بنجاح',
    registrationFailed: 'فشل التسجيل',
    orderCreated: 'تم إنشاء الطلب بنجاح',
    orderFailed: 'فشل في إنشاء الطلب',
    addedToCart: 'تم إضافة المنتج إلى السلة',
    removedFromCart: 'تم إزالة المنتج من السلة',
    cartCleared: 'تم تفريغ السلة',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
    profileUpdateFailed: 'فشل في تحديث الملف الشخصي',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    passwordChangeFailed: 'فشل في تغيير كلمة المرور',
    emailSent: 'تم إرسال البريد الإلكتروني بنجاح',
    emailFailed: 'فشل في إرسال البريد الإلكتروني',
    dataLoaded: 'تم تحميل البيانات بنجاح',
    dataLoadFailed: 'فشل في تحميل البيانات',
    unauthorized: 'غير مخول',
    unauthorizedDesc: 'تم تسجيل خروجك. جاري تسجيل الدخول مرة أخرى...',
    productNotFound: 'المنتج غير موجود',
    networkError: 'خطأ في الشبكة',
    tryAgain: 'يرجى المحاولة مرة أخرى',
    pleaseWait: 'يرجى الانتظار...',
    
    // Product categories
    waterTreatment: 'معالجة المياه',
    fuelAdditives: 'إضافات الوقود',
    paintThinner: 'الدهان والمذيبات',
    agriculturalFertilizers: 'الأسمدة الزراعية',
    
    // Product Reviews
    productReviews: 'مراجعات المنتج',
    customerReviews: 'آراء العملاء',
    addYourReview: 'أضف مراجعتك',
    writeReview: 'اكتب مراجعة',
    rating: 'التقييم',
    comment: 'التعليق',
    customerName: 'اسم العميل',
    submitReview: 'إرسال المراجعة',
    reviewSubmitted: 'نجح',
    reviewSubmittedDesc: 'تم إرسال مراجعتك بنجاح',
    reviewError: 'خطأ',
    reviewErrorDesc: 'خطأ في إرسال المراجعة',
    backToShop: 'العودة للمتجر',
    averageRating: 'متوسط التقييم',
    totalReviews: 'إجمالي المراجعات',
    noReviewsYet: 'لا توجد مراجعات بعد',
    noReviewsDesc: 'كن أول من يراجع هذا المنتج',
    reviewsAndRatings: 'المراجعات والتقييمات',
    customerFeedback: 'ملاحظات العملاء',
    
    // Footer
    aboutCompany: 'حول الشركة',
    contactInfo: 'معلومات الاتصال',
    followUs: 'تابعونا',
    allRightsReserved: 'جميع الحقوق محفوظة',
    
    // About page
    aboutTitle: 'حول مجمع ممتاز الكيميائي',
    aboutSubtitle: 'نقود صناعة الكيماويات بالابتكار والجودة والاستدامة لأكثر من 25 عاماً.',
    ourStory: 'قصتنا',
    ourMission: 'مهمتنا',
    ourVision: 'رؤيتنا',
    ourCoreValues: 'قيمنا الأساسية',
    valuesSubtitle: 'المبادئ التي توجه قراراتنا وتشكل ثقافتنا كل يوم.',
    ourTeamExpertise: 'فريقنا وخبرتنا',
    certificationsCompliance: 'الشهادات والامتثال',
    certificationsSubtitle: 'نحافظ على أعلى معايير الصناعة والشهادات لضمان الجودة والسلامة والمسؤولية البيئية.',
    
    // About content
    storyParagraph1: 'تأسس مجمع ممتاز الكيميائي في عام 1999 كشركة صغيرة لتصنيع المواد الكيميائية برؤية لتوفير حلول كيميائية عالية الجودة للصناعات في جميع أنحاء العالم. خلال السنوات الـ 25 الماضية، نمونا لنصبح شركة رائدة في التصنيع تخدم أربعة قطاعات سوقية رئيسية.',
    storyParagraph2: 'تميزت رحلتنا بالابتكار المستمر والتوسع الاستراتيجي والالتزام الثابت بالجودة. اليوم، نشغل مرافق تصنيع متطورة ونخدم العملاء في أكثر من 40 دولة حول العالم.',
    storyParagraph3: 'ونحن نتطلع إلى المستقبل، نبقى ملتزمين بتطوير علوم الكيمياء ودعم نجاح عملائنا والمساهمة في عالم أكثر استدامة.',
    missionText: 'تطوير وتصنيع حلول كيميائية مبتكرة تعزز العمليات الصناعية وتحسن أداء المنتجات وتساهم في التنمية المستدامة مع الحفاظ على أعلى معايير الجودة والسلامة.',
    visionText: 'أن نكون الشريك الأكثر ثقة في العالم في الحلول الكيميائية، معترف بنا لابتكارنا واستدامتنا والتزامنا بتطوير الصناعات مع حماية البيئة للأجيال القادمة.',
    teamText: 'يُبنى نجاحنا على خبرة فريقنا وتفانيه. نوظف أكثر من 500 محترف، بما في ذلك مهندسي الكيمياء وعلماء البحوث ومتخصصي الجودة وخبراء الصناعة.',
    
    // Values
    qualityExcellence: 'التميز في الجودة',
    qualityExcellenceDesc: 'نحافظ على أعلى المعايير في جميع منتجاتنا وعملياتنا، مع شهادات ISO التي تضمن الجودة المتسقة.',
    environmentalResponsibility: 'المسؤولية البيئية',
    environmentalResponsibilityDesc: 'ملتزمون بممارسات التصنيع المستدامة وتطوير الحلول الكيميائية الصديقة للبيئة.',
    customerFocus: 'التركيز على العملاء',
    customerFocusDesc: 'نجاح عملائنا هو أولويتنا. نقدم حلولاً مخصصة وخدمة استثنائية.',
    globalReach: 'الوصول العالمي',
    globalReachDesc: 'خدمة العملاء في أكثر من 40 دولة مع سلاسل إمداد موثوقة ودعم محلي.',
    
    // Stats
    employees: 'موظف',
    rdScientists: 'علماء البحث والتطوير',
    manufacturingSites: 'مواقع التصنيع',
    qualityRate: 'معدل الجودة',
    
    // Product Form
    productManagement: 'إدارة المنتجات',
    addProduct: 'إضافة منتج',
    editProduct: 'تحرير منتج',
    productName: 'اسم المنتج',
    shortDescription: 'وصف مختصر',
    productDescription: 'وصف المنتج',
    priceRange: 'نطاق السعر',
    productCategory: 'فئة المنتج',
    productSpecifications: 'مواصفات المنتج',
    productFeatures: 'ميزات المنتج',
    productApplications: 'تطبيقات المنتج',
    productTags: 'علامات المنتج',
    productImage: 'صورة المنتج',
    productCatalog: 'كتالوج المنتج',
    msdsDocument: 'وثيقة MSDS',
    stockQuantity: 'كمية المخزون',
    minStockLevel: 'الحد الأدنى للمخزون',
    maxStockLevel: 'الحد الأقصى للمخزون',
    unitPrice: 'سعر الوحدة',
    netWeight: 'الوزن الصافي',
    grossWeight: 'الوزن الإجمالي',
    weightUnit: 'وحدة الوزن',
    batchNumber: 'رقم الدفعة',
    productSku: 'رمز المنتج',
    productBarcode: 'الباركود',
    isVariant: 'هو متغير منتج',
    parentProduct: 'المنتج الأساسي',
    variantType: 'نوع المتغير',
    variantValue: 'قيمة المتغير',
    syncWithShop: 'مزامنة مع المتجر',
    showWhenOutOfStock: 'إظهار عند عدم التوفر',
    showCatalogToCustomers: 'إظهار الكتالوج للعملاء',
    showMsdsToCustomers: 'إظهار MSDS للعملاء',
    basicInfo: 'المعلومات الأساسية',
    pricingInventory: 'الأسعار والمخزون',
    documentsMedia: 'الوثائق والوسائط',
    variantSettings: 'إعدادات المتغيرات',
    shopSettings: 'إعدادات المتجر',
    weightsAndBatch: 'الأوزان والدفعة',
    productDetails: 'تفاصيل المنتج',
  },

  ku: {
    // Navigation
    home: 'ماڵەوە',
    about: 'دەربارەمان',
    services: 'خزمەتگوزاریەکان',
    products: 'بەرهەمەکان',
    contact: 'پەیوەندی',
    shop: {
      title: 'فرۆشگا',
      lowStockWarning: 'تەنها {count} دانە ماوە!',
      priceFilter: 'فلتەری نرخ',
      minPrice: 'کەمترین',
      maxPrice: 'زۆرترین'
    },
    
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
    bankReference: 'ژمارەی بانکی',
    enterBankReference: 'ژمارەی بانکی بنووسە',
    bankReceipt: 'وەصڵی بانک',
    uploadBankReceipt: 'وەصڵی بانک بار بکە (JPG, PNG, PDF)',
    bankReceiptRequired: 'وەصڵی بانک پێویستە بۆ گواستنەوەی بانکی',
    bankReferenceRequired: 'ژمارەی بانکی پێویستە بۆ گواستنەوەی بانکی',
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
    
    // Customer Profile
    welcomeCustomer: 'بەخێربێیت',
    customerProfile: 'پرۆفایلی کڕیار',
    manageAccount: 'بەڕێوەبردنی هەژمارەکەت و بینینی مێژووی داواکاریەکان',
    editProfile: 'دەستکاریکردنی پرۆفایل',
    continueShopping: 'بەردەوامبوونی کڕین',
    accountInformation: 'زانیاریەکانی هەژمار',
    fullName: 'ناوی تەواو',
    contactDetails: 'زانیاریەکانی پەیوەندی',
    orderNumber: 'ژمارەی داواکاری',
    totalAmount: 'کۆی گشتی',
    noOrders: 'هیچ داواکاریەک نییە',
    viewOrder: 'بینینی داواکاری',
    orderDate: 'بەرواری داواکاری',
    orderStatus: 'دۆخی داواکاری',
    confirmed: 'پەسەندکراو',
    shipped: 'نێردراوە',
    delivered: 'گەیەندراوە',
    cancelled: 'هەڵوەشاندراوەتەوە',
    logoutSuccessful: 'دەرچوون سەرکەوتوو بوو',
    logoutSuccessfulDesc: 'بە سەرکەوتووی دەرچوویت',
    logoutError: 'هەڵەیەک ڕوویدا لە کاتی دەرچوون',
    error: 'هەڵە',
    
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
    
    // Notifications and Toast Messages
    success: 'سەرکەوتن',
    errorOccurred: 'هەڵەیەک ڕوویدا',
    warning: 'ئاگاداری',
    info: 'زانیاری',
    loginSuccessful: 'چوونەژوورەوە سەرکەوتوو بوو',
    loginFailed: 'چوونەژوورەوە سەرنەکەوت',
    registrationSuccessful: 'تۆمارکردن سەرکەوتوو بوو',
    registrationFailed: 'تۆمارکردن سەرنەکەوت',
    orderCreated: 'داواکاری بە سەرکەوتووی درووستکرا',
    orderFailed: 'درووستکردنی داواکاری سەرنەکەوت',
    addedToCart: 'بەرهەم بۆ سەبەتە زیادکرا',
    removedFromCart: 'بەرهەم لە سەبەتەوە لابرا',
    cartCleared: 'سەبەتە پاککرایەوە',
    profileUpdated: 'پرۆفایل بە سەرکەوتووی نوێکرایەوە',
    profileUpdateFailed: 'نوێکردنەوەی پرۆفایل سەرنەکەوت',
    passwordChanged: 'ووشەی نهێنی بە سەرکەوتووی گۆڕدرا',
    passwordChangeFailed: 'گۆڕینی ووشەی نهێنی سەرنەکەوت',
    emailSent: 'ئیمەیل بە سەرکەوتووی نێردرا',
    emailFailed: 'ناردنی ئیمەیل سەرنەکەوت',
    dataLoaded: 'داتا بە سەرکەوتووی بارکرا',
    dataLoadFailed: 'بارکردنی داتا سەرنەکەوت',
    unauthorized: 'ڕێپێدان نییە',
    unauthorizedDesc: 'دەرچوویت. جارێکی تر چوونەژوورەوە...',
    productNotFound: 'بەرهەم نەدۆزرایەوە',
    networkError: 'هەڵەی تۆڕ',
    tryAgain: 'تکایە دووبارە هەوڵبدە',
    pleaseWait: 'تکایە چاوەڕێبە...',
    
    // Product categories
    waterTreatment: 'چارەسەری ئاو',
    fuelAdditives: 'زیادکەرەکانی سووتەمەنی',
    paintThinner: 'بۆیە و تیننەر',
    agriculturalFertilizers: 'پەینی کشتوکاڵی',
    
    // Product Reviews
    productReviews: 'نرخاندنی بەرهەم',
    customerReviews: 'ڕاى کڕیاران',
    addYourReview: 'نرخاندنەکەت زیاد بکە',
    writeReview: 'نرخاندن بنووسە',
    rating: 'نرخاندن',
    comment: 'لێدوان',
    customerName: 'ناوی کڕیار',
    submitReview: 'نرخاندن بنێرە',
    reviewSubmitted: 'سەرکەوتن',
    reviewSubmittedDesc: 'نرخاندنەکەت بە سەرکەوتووی نێردرا',
    reviewError: 'هەڵە',
    reviewErrorDesc: 'هەڵە لە ناردنی نرخاندن',
    backToShop: 'گەڕانەوە بۆ فرۆشگا',
    averageRating: 'تێکڕای نرخاندن',
    totalReviews: 'کۆی نرخاندنەکان',
    noReviewsYet: 'هێشتا نرخاندنێک نییە',
    noReviewsDesc: 'یەکەم کەس بە کە نرخاندنی ئەم بەرهەمە بکات',
    productSpecifications: 'تایبەتمەندیەکان',
    reviewsAndRatings: 'نرخاندن و پلەبەندی',
    customerFeedback: 'ڕاى کڕیاران',
    
    // Footer
    aboutCompany: 'دەربارەی کۆمپانیا',
    contactInfo: 'زانیاریەکانی پەیوەندی',
    followUs: 'شوێنمان بکەون',
    allRightsReserved: 'هەموو مافەکان پارێزراون',
    
    // About page
    aboutTitle: 'دەربارەی مەجمەعی ممتاز الکیمیائی',
    aboutSubtitle: 'بۆ زیاتر لە 25 ساڵ پێشەنگی پیشەسازی کیمیاوی دەکەین بە نوێکاری و کوالیتی و بەردەوامی.',
    ourStory: 'چیرۆکی ئێمە',
    ourMission: 'ئەرکی ئێمە',
    ourVision: 'بینینی ئێمە',
    ourCoreValues: 'بەهاە بنەڕەتیەکانی ئێمە',
    valuesSubtitle: 'ئەو بنەماانەی کە بڕیارەکانمان ڕێنمایی دەکەن و کەلتوورمان شێوە دەدەن هەموو ڕۆژێک.',
    ourTeamExpertise: 'تیمی ئێمە و شارەزایی',
    certificationsCompliance: 'بڕوانامە و گونجاندن',
    certificationsSubtitle: 'ئێمە بەرزترین ستانداردە پیشەسازیەکان و بڕوانامەکان هەڵدەگرین بۆ دڵنیابوون لە کوالیتی و سەلامەتی و بەرپرسیارێتی ژینگەیی.',
    
    // About content
    storyParagraph1: 'مەجمەعی ممتاز الکیمیائی لە ساڵی 1999دا دامەزرا وەک کۆمپانیایەکی بچووکی بەرهەمهێنانی کیمیاوی بە بینینێک بۆ دابینکردنی چارەسەرە کیمیاویە بەرزە کوالیتیەکان بۆ پیشەسازیەکان لە هەموو جیهاندا. لە ماوەی 25 ساڵی ڕابردوودا، گەشەمان کردووە بۆ ئەوەی ببینە بەرهەمهێنەرێکی پێشەنگ کە چوار بەشی سەرەکی بازاڕ خزمەت دەکات.',
    storyParagraph2: 'گەشتی ئێمە بە نوێکاری بەردەوام و فراوانکردنی ستراتیژی و پابەندبوونی نەهێشتووی بە کوالیتی تایبەتمەند بووە. ئەمڕۆ، ئێمە شوێنە بەرهەمهێنانە پێشکەوتووەکان بەڕێوە دەبەین و کڕیارانمان لە زیاتر لە 40 وڵات لە هەموو جیهاندا خزمەت دەکەین.',
    storyParagraph3: 'لەگەڵ ئەوەی چاومان لە داهاتووە، بەردەوام پابەندین بە پێشخستنی زانستی کیمیا و پاڵپشتیکردنی سەرکەوتنی کڕیارانمان و بەشدارکردن لە جیهانێکی زیاتر بەردەوام.',
    missionText: 'پەرەپێدان و بەرهەمهێنانی چارەسەرە کیمیاویە نوێکارەکان کە پرۆسە پیشەسازیەکان بەهێز دەکەن و کارایی بەرهەمەکان باشتر دەکەن و بەشداری لە گەشەسەندنی بەردەوام دەکەن لەگەڵ پاراستنی بەرزترین ستانداردەکانی کوالیتی و سەلامەتی.',
    visionText: 'بوون بە هاوبەشی بەتوانایی ترین جیهان لە چارەسەرە کیمیاویەکاندا، ناسراو بۆ نوێکاری و بەردەوامی و پابەندبوونمان بە پێشخستنی پیشەسازیەکان لەگەڵ پاراستنی ژینگە بۆ نەوەکانی داهاتوو.',
    teamText: 'سەرکەوتنی ئێمە لەسەر شارەزایی و دەستخۆشی تیمەکەمان بنیاد نراوە. ئێمە زیاتر لە 500 پیشەیی دامەزراندووە، لەوانە ئەندازیارانی کیمیا و زانایانی لێکۆڵینەوە و پسپۆڕانی کوالیتی و پسپۆڕانی پیشەسازی.',
    
    // Values
    qualityExcellence: 'تایبەتمەندی کوالیتی',
    qualityExcellenceDesc: 'ئێمە بەرزترین ستانداردەکان لە هەموو بەرهەم و پرۆسەکانماندا ڕادەگرین، لەگەڵ بڕوانامەکانی ISO کە کوالیتی یەکگرتوو دڵنیا دەکات.',
    environmentalResponsibility: 'بەرپرسیارێتی ژینگەیی',
    environmentalResponsibilityDesc: 'پابەندین بە شێوازە بەرهەمهێنانە بەردەوامەکان و پەرەپێدانی چارەسەرە کیمیاویە دۆستی ژینگەکان.',
    customerFocus: 'سەرنج لە کڕیارەکان',
    customerFocusDesc: 'سەرکەوتنی کڕیارانمان لە پێشینەی ئێمەدایە. ئێمە چارەسەرە تایبەتەکان و خزمەتگوزاریە نایابەکان دابین دەکەین.',
    globalReach: 'گەیشتنی جیهانی',
    globalReachDesc: 'خزمەتکردنی کڕیارەکان لە زیاتر لە 40 وڵات لەگەڵ زنجیرەی دابینکردنی متمانەپێکراو و پاڵپشتی خۆجێیی.',
    
    // Stats
    employees: 'کارمەندان',
    rdScientists: 'زانایانی لێکۆڵینەوە و پەرەپێدان',
    manufacturingSites: 'شوێنە بەرهەمهێنانەکان',
    qualityRate: 'ڕێژەی کوالیتی',
  },
  
  tr: {
    // Navigation
    home: 'Ana Sayfa',
    about: 'Hakkımızda',
    services: 'Hizmetler',
    products: 'Ürünler',
    contact: 'İletişim',
    shop: {
      title: 'Mağaza',
      lowStockWarning: 'Sadece {count} adet kaldı!',
      priceFilter: 'Fiyat Filtresi',
      minPrice: 'En Az',
      maxPrice: 'En Çok'
    },
    
    // Common actions
    login: 'Giriş Yap',
    logout: 'Çıkış Yap',
    register: 'Kayıt Ol',
    submit: 'Gönder',
    cancel: 'İptal',
    save: 'Kaydet',
    edit: 'Düzenle',
    delete: 'Sil',
    search: 'Ara',
    loading: 'Yükleniyor',
    
    // Product related
    addToCart: 'Sepete Ekle',
    viewDetails: 'Detayları Görüntüle',
    price: 'Fiyat',
    quantity: 'Miktar',
    category: 'Kategori',
    inStock: 'Stokta Var',
    outOfStock: 'Stokta Yok',
    
    // Cart and checkout
    cart: 'Sepet',
    checkout: 'Ödeme',
    total: 'Toplam',
    subtotal: 'Ara Toplam',
    shipping: 'Kargo',
    orderSummary: 'Sipariş Özeti',
    placeOrder: 'Siparişi Ver',
    
    // User account
    myAccount: 'Hesabım',
    myOrders: 'Siparişlerim',
    profile: 'Profil',
    wallet: 'Cüzdan',
    orderHistory: 'Sipariş Geçmişi',
    
    // Wallet specific
    walletTitle: 'Dijital Cüzdan',
    currentBalance: 'Mevcut Bakiye',
    requestRecharge: 'Yeniden Yükleme Talep Et',
    rechargeAmount: 'Yeniden Yükleme Tutarı',
    rechargeHistory: 'Yeniden Yükleme Geçmişi',
    
    // Product categories
    waterTreatment: 'Su Arıtma',
    fuelAdditives: 'Yakıt Katkıları',
    paintThinner: 'Boya ve İncelticiler',
    agriculturalFertilizers: 'Tarımsal Gübreler',
    
    // Footer
    aboutCompany: 'Şirket Hakkında',
    contactInfo: 'İletişim Bilgileri',
    followUs: 'Bizi Takip Edin',
    allRightsReserved: 'Tüm Hakları Saklıdır',
    
    // About page
    aboutTitle: 'Momtazchem Hakkında',
    aboutSubtitle: '25 yılı aşkın süredir inovasyon, kalite ve sürdürülebilirlik ile kimya endüstrisine liderlik ediyoruz.',
    ourStory: 'Hikayemiz',
    ourMission: 'Misyonumuz',
    ourVision: 'Vizyonumuz',
    ourCoreValues: 'Temel Değerlerimiz',
    valuesSubtitle: 'Her gün kararlarımıza rehberlik eden ve kültürümüzü şekillendiren prensipler.',
    ourTeamExpertise: 'Ekibimiz ve Uzmanlığımız',
    certificationsCompliance: 'Sertifikalar ve Uyumluluk',
    certificationsSubtitle: 'Kalite, güvenlik ve çevresel sorumluluk sağlamak için en yüksek endüstri standartlarını ve sertifikalarını sürdürüyoruz.',
    
    // About content
    storyParagraph1: '1999 yılında kurulan Momtazchem, dünya çapındaki endüstrilere yüksek kaliteli kimyasal çözümler sağlama vizyonu ile küçük bir kimyasal üretim şirketi olarak başladı. Son 25 yılda, dört ana pazar segmentine hizmet veren lider bir üretici haline geldik.',
    storyParagraph2: 'Yolculuğumuz sürekli inovasyon, stratejik genişleme ve kaliteye olan sarsılmaz bağlılığımızla şekillenmiştir. Bugün, son teknoloji üretim tesisleri işletiyoruz ve dünya çapında 40\'tan fazla ülkede müşterilere hizmet veriyoruz.',
    storyParagraph3: 'Geleceğe bakarken, kimya bilimini ilerletme, müşterilerimizin başarısını destekleme ve daha sürdürülebilir bir dünyaya katkıda bulunma konusundaki kararlılığımızı sürdürüyoruz.',
    missionText: 'Endüstriyel süreçleri geliştiren, ürün performansını artıran ve en yüksek kalite ve güvenlik standartlarını korurken sürdürülebilir kalkınmaya katkıda bulunan yenilikçi kimyasal çözümler geliştirmek ve üretmek.',
    visionText: 'Kimyasal çözümlerde dünyanın en güvenilir ortağı olmak, inovasyonumuz, sürdürülebilirliğimiz ve gelecek nesiller için çevreyi korurken endüstrileri ilerletme taahhüdümüzle tanınmak.',
    teamText: 'Başarımız ekibimizin uzmanlığı ve özverisine dayanır. Kimya mühendisleri, araştırma bilimcileri, kalite uzmanları ve endüstri uzmanları dahil 500\'den fazla profesyonel istihdam ediyoruz.',
    
    // Values
    qualityExcellence: 'Kalite Mükemmelliği',
    qualityExcellenceDesc: 'Tutarlı kaliteyi sağlayan ISO sertifikalarıyla tüm ürün ve süreçlerimizde en yüksek standartları sürdürüyoruz.',
    environmentalResponsibility: 'Çevresel Sorumluluk',
    environmentalResponsibilityDesc: 'Sürdürülebilir üretim uygulamalarına ve çevre dostu kimyasal çözümler geliştirmeye kararlıyız.',
    customerFocus: 'Müşteri Odaklılık',
    customerFocusDesc: 'Müşterilerimizin başarısı önceliğimizdir. Özel çözümler ve olağanüstü hizmet sağlıyoruz.',
    globalReach: 'Küresel Erişim',
    globalReachDesc: 'Güvenilir tedarik zincirleri ve yerel destekle 40\'tan fazla ülkede müşterilere hizmet veriyoruz.',
    
    // Stats
    employees: 'Çalışan',
    rdScientists: 'Ar-Ge Bilimcisi',
    manufacturingSites: 'Üretim Tesisi',
    qualityRate: 'Kalite Oranı',
    
    // Additional translations
    firstName: 'Ad',
    lastName: 'Soyad',
    email: 'E-posta',
    phone: 'Telefon',
    address: 'Adres',
    city: 'Şehir',
    country: 'Ülke',
    company: 'Şirket',
    
    // Messages
    welcomeMessage: 'Momtazchem\'e Hoş Geldiniz',
    thankYou: 'Teşekkür Ederiz',
    orderConfirmed: 'Siparişiniz onaylandı',
    contactSuccess: 'Mesajınız başarıyla gönderildi',
    
    // Customer Profile
    welcomeCustomer: 'Hoş Geldiniz',
    customerProfile: 'Müşteri Profili',
    manageAccount: 'Hesabınızı yönetin ve sipariş geçmişinizi görüntüleyin',
    editProfile: 'Profili Düzenle',
    continueShopping: 'Alışverişe Devam Et',
    accountInformation: 'Hesap Bilgileri',
    fullName: 'Ad Soyad',
    contactDetails: 'İletişim Detayları',
    orderNumber: 'Sipariş Numarası',
    totalAmount: 'Toplam Tutar',
    noOrders: 'Sipariş bulunamadı',
    viewOrder: 'Siparişi Görüntüle',
    orderDate: 'Sipariş Tarihi',
    orderStatus: 'Sipariş Durumu',
    confirmed: 'Onaylandı',
    shipped: 'Gönderildi',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal Edildi',
    logoutSuccessful: 'Çıkış Başarılı',
    logoutSuccessfulDesc: 'Başarıyla çıkış yaptınız',
    logoutError: 'Çıkış sırasında bir hata oluştu',
    error: 'Hata',
    
    // Wallet
    walletBalance: 'Cüzdan Bakiyesi',
    requestRechargeButton: 'Yeniden Yükleme Talep Et',
    rechargeRequests: 'Yeniden Yükleme Talepleri',
    pendingApproval: 'Onay Bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    requestDate: 'Talep Tarihi',
    amount: 'Tutar',
    status: 'Durum',
    notes: 'Notlar',
    noRechargeRequests: 'Yeniden yükleme talebi bulunamadı',
    enterAmount: 'Tutarı girin',
    minimumAmount: 'Minimum tutar',
    invalidAmount: 'Geçersiz tutar',
    amountRequired: 'Tutar gereklidir',
    errorCreatingRequest: 'Cüzdan yeniden yükleme talebi oluşturulurken hata',
    loginToAccessWallet: 'Cüzdanınıza erişmek için lütfen giriş yapın',
    goToLogin: 'Girişe Git',
    totalWithdrawals: 'Toplam çekimler',
    totalDeposits: 'Toplam yatırımlar',
    requestSubmitted: 'Cüzdan yeniden yükleme talebiniz başarıyla gönderildi ve onay bekliyor.',
    requestPendingApproval: 'Talep onay bekliyor',
  },
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'en' || language === 'tr' ? 'ltr' : 'rtl';
};

export const getLanguageName = (language: Language): string => {
  const names = {
    en: 'English',
    ar: 'العربية',
    ku: 'کوردی',
    tr: 'Türkçe'
  };
  return names[language];
};
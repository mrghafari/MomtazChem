export type Language = 'en' | 'ar';

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
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'en' ? 'ltr' : 'rtl';
};

export const getLanguageName = (language: Language): string => {
  const names = {
    en: 'English',
    ar: 'العربية'
  };
  return names[language];
};
export type Language = 'en' | 'ar';

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
    inStock: string;
    outOfStock: string;
    volumeDeals: string;
    active: string;
    off: string;
    more: string;
    items: string;
    max: string;
    buy: string;
    catalog: string;
    addToCart: string;
    addMore: string;
    notAvailable: string;
    insufficientStock: string;
    maxStockInCart: string;
    onlyXAvailable: string;
    onlyXLeft: string;
    productReviews: string;
    technicalSpecs: string;
    hideWalletBalance: string;
    showWalletBalance: string;
    addedToCart: string;
    addedToCartDesc: string;
    welcome: string;
    registrationSuccessful: string;
    welcomeMessage: string;
    logoutSuccessful: string;
    logoutMessage: string;
    error: string;
    logoutError: string;
    loginSuccessful: string;
    loginWelcome: string;
    unit: string;
    units: string;
    
    // Filters & Sorting
    filters: string;
    searchProducts: string;
    searchProductsPlaceholder: string;
    sortBy: string;
    relevance: string;
    name: string;
    categories: string;
    priceRange: string;
    clearAllFilters: string;
    clearFilters: string;
    ascending: string;
    descending: string;
    highToLow: string;
    lowToHigh: string;
    aToZ: string;
    zToA: string;
    availability: string;
    inStockOnly: string;
    newest: string;
    showingProducts: string;
    page: string;
    of: string;
    product: string;
    products: string;
  };

  // Blog page
  blog: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTags: string;
    readMore: string;
    by: string;
    views: string;
    noPostsFound: string;
    noPostsMessage: string;
    loadingPosts: string;
    previousPage: string;
    nextPage: string;
    page: string;
    of: string;
  };

  // Blog post page
  blogPost: {
    loading: string;
    notFound: string;
    notFoundMessage: string;
    backToBlog: string;
    shareArticle: string;
    copyLink: string;
    linkCopied: string;
    linkCopiedMessage: string;
    tableOfContents: string;
    aboutAuthor: string;
    relatedPosts: string;
    noRelatedPosts: string;
    readingTime: string;
    minutes: string;
    publishedOn: string;
    updatedOn: string;
    previousPost: string;
    nextPost: string;
    tags: string;
    share: string;
  };

  // Checkout page
  checkout_page: {
    // Page titles & headers
    welcomeTitle: string;
    orderPlacedSuccess: string;
    orderFailed: string;
    orderFailedDesc: string;
    
    // Customer Information
    customerInfo: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    company: string;
    required: string;
    
    // Address Fields
    billingAddress: string;
    shippingAddress: string;
    fullAddress: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    province: string;
    postalCode: string;
    country: string;
    selectProvince: string;
    selectCity: string;
    selectProvinceFirst: string;
    
    // Recipient Information
    recipientInfo: string;
    recipientName: string;
    recipientPhone: string;
    recipientMobile: string;
    recipientAddress: string;
    deliveryAddress: string;
    fullRecipientName: string;
    recipientMobilePlaceholder: string;
    fullDeliveryAddress: string;
    
    // Second Address
    secondAddress: string;
    secondDeliveryAddress: string;
    secondFullAddress: string;
    secondCity: string;
    secondProvince: string;
    secondPostalCode: string;
    mobileDeliveryRecipient: string;
    
    // Shipping & Delivery
    shippingMethod: string;
    selectShippingMethod: string;
    smartSelection: string;
    deliveryMethod: string;
    estimatedDelivery: string;
    shippingCost: string;
    shippingCostLabel: string;
    freeShipping: string;
    days: string;
    vehicleType: string;
    calculatingBestVehicle: string;
    smartSelectionDetails: string;
    selectedVehicleLabel: string;
    weightCapacity: string;
    volumeCapacity: string;
    allowedRoutesLabel: string;
    hazardousTransport: string;
    refrigeratedTransport: string;
    fragileHandling: string;
    freeShippingOver: string;
    moreForFreeShipping: string;
    cubicMeter: string;
    
    // Payment
    paymentInfo: string;
    paymentMethodTitle: string;
    selectPaymentMethod: string;
    selectPaymentPlaceholder: string;
    bankReceiptUpload: string;
    onlinePaymentMethod: string;
    walletPayment: string;
    walletPaymentTitle: string;
    useWallet: string;
    walletBalance: string;
    walletAmountToUse: string;
    amountToUse: string;
    maxAmount: string;
    maximum: string;
    amountFromWallet: string;
    remainingAmount: string;
    remainingBalance: string;
    availableFunds: string;
    orderFullyPaidByWallet: string;
    noAdditionalPaymentNeeded: string;
    secondaryPayment: string;
    selectSecondaryPayment: string;
    
    // Order Notes
    orderNotes: string;
    orderNotesOptional: string;
    orderNotesPlaceholder: string;
    specialInstructions: string;
    
    // Actions
    placeOrder: string;
    processingOrder: string;
    continueToPayment: string;
    backToShop: string;
    orderNumber: string;
    
    // Purchase Order Summary
    purchaseOrder: string;
    orderSummary: string;
    productList: string;
    subtotal: string;
    totalWeight: string;
    shipping: string;
    tax: string;
    discount: string;
    walletUsed: string;
    total: string;
    minimize: string;
    
    // Cart Management
    cartManagement: string;
    removeItem: string;
    updateQuantity: string;
    emptyCart: string;
    
    // Validation Messages
    validEmail: string;
    minCharacters: string;
    minTwoCharacters: string;
    validPhone: string;
    addressRequired: string;
    cityRequired: string;
    stateRequired: string;
    postalRequired: string;
    countryRequired: string;
    selectShipping: string;
    selectPayment: string;
    
    // Units & Measurements
    kg: string;
    ton: string;
    liter: string;
    piece: string;
    iqd: string;
    usd: string;
    
    // New translations for checkout.tsx
    deliveryTitle: string;
    useSecondaryAddress: string;
    secondaryAddressSelected: string;
    cityLabel: string;
    recipientInfoTitle: string;
    recipientInfoLabel: string;
    recipientInfoNote: string;
    recipientNameLabel: string;
    recipientNamePlaceholder: string;
    recipientPhoneLabel: string;
    recipientAddressLabel: string;
    recipientAddressPlaceholder: string;
    secondAddressOrMobile: string;
    secondAddressNote: string;
    secondAddressOptional: string;
    hideButton: string;
    addSecondAddress: string;
    secondFullAddressLabel: string;
    secondFullAddressPlaceholder: string;
    fullAddressLabel: string;
    secondAddressDeliveryPlaceholder: string;
    provinceLabel: string;
    selectProvincePlaceholder: string;
    citySelectLabel: string;
    selectCityPlaceholder: string;
    postalCodeLabel: string;
    postalCodePlaceholder: string;
    differentMobileOptional: string;
    differentMobileLabel: string;
    addDifferentNumber: string;
    recipientMobileLabel: string;
    thisNumberForDelivery: string;
    mobileForDeliveryContact: string;
    shippingMethodTitle: string;
    selectShippingLabel: string;
    selectShippingPlaceholder: string;
    smartSelectionNote: string;
    destination: string;
    weight: string;
    basePrice: string;
    distance: string;
    autoCalculate: string;
    specifyDestinationCity: string;
    addProductsToCart: string;
    erbilCity: string;
    heavyTruck: string;
    flammableSuffix: string;
    warehouseNoteActive: string;
    warehouseNoteSecond: string;
    warehouseNoteCRM: string;
    warehouseNotePhone: string;
    warehouseNoteDifferentMobile: string;
    warehouseNoteCRMPhone: string;
    orderCodeAfterCheckout: string;
    productCode: string;
    removeFromCart: string;
    removedFromCartMsg: string;
    defaultAddressInactive: string;
    defaultAddressCRM: string;
    provinceField: string;
    cityField: string;
    phoneField: string;
    unknown: string;
    secondAddressOrDifferentMobile: string;
    
    // Order Summary Section
    orderSummaryTitle: string;
    itemCount: string;
    approximateWeight: string;
    defaultDeliveryAddress: string;
    activeDeliveryInfo: string;
    draggableCardMessage: string;
    smartVehicleSelectionLabel: string;
    
    // Draggable Card
    dragging: string;
    draggable: string;
    dragToMove: string;
    
    // Order Details
    orderContainsItems: string;
    items: string;
    orderDate: string;
    
    // Vehicle Selection
    vehicleTypeLabel: string;
    weightCapacityLabel: string;
    destinationLabel: string;
    baseCostLabel: string;
    distanceFromErbil: string;
    kilometer: string;
    autoCalculation: string;
    
    // Active Address Info
    activeAddress: string;
    recipientPhoneNumber: string;
    infoWillBeUsed: string;
    addressNotUsed: string;
    defaultAddressNote: string;
    
    // Form Labels
    secondAddressTitle: string;
    differentMobileNumberLabel: string;
    
    // Actions
    continueShoppingBtn: string;
    clearCartBtn: string;
    cartClearedTitle: string;
    allProductsRemoved: string;
    
    // Payment Summary
    paymentSummaryTitle: string;
    itemsTotal: string;
    shippingCostSummary: string;
    free: string;
    valueAddedTax: string;
    valueAddedDuty: string;
    walletUsedSummary: string;
    totalPayable: string;
    freeShippingEligible: string;
    fullyPaidByWallet: string;
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
  
  // Batch Management
  batchManagement: {
    pageTitle: string;
    pageSubtitle: string;
    searchBatches: string;
    searchDescription: string;
    barcodeLabel: string;
    barcodePlaceholder: string;
    searchButton: string;
    currentSellingBatch: string;
    currentSellingDescription: string;
    batchNumber: string;
    stock: string;
    stockUnits: string;
    productionDate: string;
    activeStatus: string;
    totalBatches: string;
    totalStock: string;
    barcode: string;
    emptyBatches: string;
    batchList: string;
    batchListDescription: string;
    soldOut: string;
    selling: string;
    waiting: string;
    price: string;
    netWeight: string;
    batchNotFound: string;
    noBatchesMessage: string;
    loadingBatches: string;
  };
  
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
  
  // Wallet Management (Admin)
  walletHolders: string;
  walletManagement: string;
  changeAmount: string;
  reason: string;
  apply: string;
  modifyBalance: string;
  addSubtractAmount: string;
  reasonForChange: string;
  allWalletHolders: string;
  noWalletsFound: string;
  syncWallet: string;
  
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
  paintSolvents: string;
  industrialChemicals: string;
  technicalEquipment: string;
  commercialGoods: string;
  
  // Product category descriptions
  fuelAdditivesDesc: string;
  waterTreatmentDesc: string;
  paintSolventsDesc: string;
  agriculturalFertilizersDesc: string;
  industrialChemicalsDesc: string;
  paintThinnerDesc: string;
  technicalEquipmentDesc: string;
  commercialGoodsDesc: string;
  
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
  productReviewsFor: string;
  totalReviewsCount: string;
  loginToReview: string;
  loginToReviewDesc: string;
  reviewingAs: string;
  yourPreviousReview: string;
  editReview: string;
  postedOn: string;
  editYourReview: string;
  updateReview: string;
  beFirstToReview: string;
  you: string;
  reviewUpdated: string;
  reviewUpdatedDesc: string;
  review: string;
  reviews: string;
  
  // Footer
  aboutCompany: string;
  contactInfo: string;
  followUs: string;
  allRightsReserved: string;
  
  // Bank Receipt
  uploadBankReceipt: string;
  bankReceiptRequired: string;
  bankReferenceRequired: string;
  
  // Home Page - Hero Section
  advancedChemical: string;
  solutions: string;
  forIndustry: string;
  heroDescription: string;
  exploreProducts: string;
  contactSales: string;
  
  // Home Page
  ourProductPortfolio: string;
  productPortfolioDesc: string;
  products_plural: string;
  availableProducts: string;
  moreProducts: string;
  viewAll: string;
  aboutMomtazchem: string;
  aboutMomtazchemDesc1: string;
  aboutMomtazchemDesc2: string;
  qualityExcellence: string;
  qualityExcellenceDesc: string;
  sustainability: string;
  sustainabilityDesc: string;
  learnMoreAboutUs: string;
  customerSatisfaction: string;
  ourServicesCapabilities: string;
  servicesCapabilitiesDesc: string;
  rdServices: string;
  rdServicesDesc: string;
  customFormulations: string;
  productTesting: string;
  performanceAnalysis: string;
  globalDistribution: string;
  globalDistributionDesc: string;
  countries40Plus: string;
  expressShipping: string;
  bulkOrders: string;
  technicalSupport: string;
  technicalSupportDesc: string;
  support24_7: string;
  applicationTraining: string;
  documentation: string;
  
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
  
  // Values (same as in Home Page)
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
  
  // Certifications
  iso9001: string;
  iso9001Desc: string;
  iso14001: string;
  iso14001Desc: string;
  ohsas18001: string;
  ohsas18001Desc: string;
  reachCompliance: string;
  reachComplianceDesc: string;
  
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
  bankReference: string;
  requestRecharge: string;
  enterBankReference: string;
  rechargeAmount: string;
  bankReceipt: string;
  rechargeHistory: string;
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
  loadingReviews: string;
  customerReviewTitle: string;
  
  // Contact Page
  contactPage: {
    // Form Labels
    firstName: string;
    lastName: string;
    emailAddress: string;
    company: string;
    productInterest: string;
    message: string;
    
    // Form Placeholders
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
    companyPlaceholder: string;
    productInterestPlaceholder: string;
    messagePlaceholder: string;
    
    // Product Categories
    waterTreatment: string;
    fuelAdditives: string;
    paintThinner: string;
    agriculturalFertilizers: string;
    industrialChemicals: string;
    technicalEquipment: string;
    commercialGoods: string;
    customSolutions: string;
    
    // Buttons
    sending: string;
    sendMessage: string;
    
    // Toast Messages
    messageSent: string;
    messageSentDesc: string;
    errorTitle: string;
    errorDesc: string;
    
    // Sections
    contactInformation: string;
    ourCertifications: string;
    findUs: string;
    visitHeadquarters: string;
    getDirections: string;
    viewInMaps: string;
  };
  
  // Services Page
  servicesPage: {
    title: string;
    subtitle: string;
    
    // Service 1: R&D
    rdTitle: string;
    rdDesc: string;
    rdFeature1: string;
    rdFeature2: string;
    rdFeature3: string;
    rdFeature4: string;
    rdFeature5: string;
    rdFeature6: string;
    
    // Service 2: Distribution
    distributionTitle: string;
    distributionDesc: string;
    distFeature1: string;
    distFeature2: string;
    distFeature3: string;
    distFeature4: string;
    distFeature5: string;
    distFeature6: string;
    
    // Service 3: Technical Support
    techSupportTitle: string;
    techSupportDesc: string;
    techFeature1: string;
    techFeature2: string;
    techFeature3: string;
    techFeature4: string;
    techFeature5: string;
    techFeature6: string;
    
    // Service 4: Consulting
    consultingTitle: string;
    consultingDesc: string;
    consultFeature1: string;
    consultFeature2: string;
    consultFeature3: string;
    consultFeature4: string;
    consultFeature5: string;
    consultFeature6: string;
    
    // Service 5: Quality Assurance
    qaTitle: string;
    qaDesc: string;
    qaFeature1: string;
    qaFeature2: string;
    qaFeature3: string;
    qaFeature4: string;
    qaFeature5: string;
    qaFeature6: string;
    
    // Service 6: Custom Manufacturing
    customMfgTitle: string;
    customMfgDesc: string;
    customFeature1: string;
    customFeature2: string;
    customFeature3: string;
    customFeature4: string;
    customFeature5: string;
    customFeature6: string;
    
    // Capabilities
    coreCapabilities: string;
    coreCapabilitiesDesc: string;
    advManufacturing: string;
    advManufacturingDesc: string;
    qualityControl: string;
    qualityControlDesc: string;
    globalReachCap: string;
    globalReachCapDesc: string;
    expertTeam: string;
    expertTeamDesc: string;
    
    // Service Process
    serviceProcess: string;
    serviceProcessDesc: string;
    consultation: string;
    consultationDesc: string;
    development: string;
    developmentDesc: string;
    testing: string;
    testingDesc: string;
    delivery: string;
    deliveryDesc: string;
    
    // CTA
    readyToStart: string;
    contactExpertsDesc: string;
    contactSales: string;
    requestQuote: string;
    
    // Contact Form
    contactSalesTitle: string;
    fullName: string;
    emailAddress: string;
    companyName: string;
    phoneNumber: string;
    message: string;
    messagePlaceholder: string;
    cancel: string;
    sendMessage: string;
    sending: string;
    
    // Quote Form  
    requestQuoteTitle: string;
    productCategory: string;
    productCategoryPlaceholder: string;
    requiredQuantity: string;
    quantityPlaceholder: string;
    requiredTimeline: string;
    timelinePlaceholder: string;
    productSpecs: string;
    specsPlaceholder: string;
    additionalReqs: string;
    additionalPlaceholder: string;
    submitQuote: string;
    submitting: string;
    
    // Toast Messages
    messageSent: string;
    messageSentDesc: string;
    quoteSubmitted: string;
    quoteSubmittedDesc: string;
    errorTitle: string;
    messageFailed: string;
    quoteFailed: string;
  };
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
      maxPrice: 'Max',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      volumeDeals: 'Volume Deals',
      active: 'ACTIVE',
      off: 'OFF',
      more: 'more',
      items: 'items',
      max: 'MAX',
      buy: 'Buy',
      catalog: 'Catalog',
      addToCart: 'Add to Cart',
      addMore: 'Add More',
      notAvailable: 'Not Available',
      insufficientStock: 'Insufficient Stock',
      maxStockInCart: 'Maximum stock of this product is in cart',
      onlyXAvailable: 'Only {count} units of this product available',
      onlyXLeft: 'Only {count} left!',
      productReviews: 'Product Reviews & Rating',
      technicalSpecs: 'Technical Specifications',
      hideWalletBalance: 'Hide Wallet Balance',
      showWalletBalance: 'Show Wallet Balance',
      addedToCart: 'Added to Cart',
      addedToCartDesc: '{count} units of {product} added to cart',
      welcome: 'Welcome',
      registrationSuccessful: 'Registration Successful',
      welcomeMessage: 'Welcome {name}',
      logoutSuccessful: 'Logout Successful',
      logoutMessage: 'You have successfully logged out',
      error: 'Error',
      logoutError: 'Error logging out',
      loginSuccessful: 'Login Successful',
      loginWelcome: 'Welcome back! You can now checkout',
      unit: 'unit',
      units: 'units',
      
      // Filters & Sorting
      filters: 'Filters',
      searchProducts: 'Search Products',
      searchProductsPlaceholder: '...Search products',
      sortBy: 'Sort by',
      relevance: 'Relevance',
      name: 'Name',
      categories: 'Categories',
      priceRange: 'Price Range',
      clearAllFilters: 'Clear All Filters',
      clearFilters: 'Clear all filters',
      ascending: 'Ascending',
      descending: 'Descending',
      highToLow: 'High to Low',
      lowToHigh: 'Low to High',
      aToZ: 'A-Z',
      zToA: 'Z-A',
      availability: 'Availability',
      inStockOnly: 'In Stock Only',
      newest: 'Newest',
      showingProducts: 'Showing',
      page: 'page',
      of: 'of',
      product: 'product',
      products: 'products',
    },

    // Blog page
    blog: {
      title: 'Blog - Chemical Industry Insights',
      subtitle: 'Latest articles, guides, and insights about chemical solutions, fuel additives, water treatment, and industrial chemicals',
      searchPlaceholder: 'Search articles by title or content...',
      allTags: 'All Tags',
      readMore: 'Read More',
      by: 'By',
      views: 'views',
      noPostsFound: 'No Posts Found',
      noPostsMessage: 'We couldn\'t find any blog posts matching your criteria. Try adjusting your search or filters.',
      loadingPosts: 'Loading posts...',
      previousPage: 'Previous',
      nextPage: 'Next',
      page: 'Page',
      of: 'of',
    },

    // Blog post page
    blogPost: {
      loading: 'Loading article...',
      notFound: 'Article Not Found',
      notFoundMessage: 'The article you are looking for does not exist or has been removed.',
      backToBlog: 'Back to Blog',
      shareArticle: 'Share Article',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      linkCopiedMessage: 'The article link has been copied to your clipboard.',
      tableOfContents: 'Table of Contents',
      aboutAuthor: 'About the Author',
      relatedPosts: 'Related Articles',
      noRelatedPosts: 'No related articles found.',
      readingTime: 'Reading Time',
      minutes: 'min read',
      publishedOn: 'Published on',
      updatedOn: 'Updated on',
      previousPost: 'Previous Article',
      nextPost: 'Next Article',
      tags: 'Tags',
      share: 'Share',
    },

    // Checkout page
    checkout_page: {
      // Page titles & headers
      welcomeTitle: 'Welcome to Checkout',
      orderPlacedSuccess: 'Order Placed Successfully!',
      orderFailed: 'Order Failed',
      orderFailedDesc: 'There was an error processing your order. Please try again.',
      
      // Customer Information
      customerInfo: 'Customer Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      emailAddress: 'Email Address',
      phoneNumber: 'Phone Number',
      company: 'Company',
      required: '*',
      
      // Address Fields
      billingAddress: 'Billing Address',
      shippingAddress: 'Shipping Address',
      fullAddress: 'Full Address',
      addressLine1: 'Address Line 1',
      addressLine2: 'Address Line 2',
      city: 'City',
      state: 'State/Province',
      province: 'Province',
      postalCode: 'Postal Code',
      country: 'Country',
      selectProvince: 'Select Province',
      selectCity: 'Select City',
      selectProvinceFirst: 'Select Province First',
      
      // Recipient Information
      recipientInfo: 'Recipient Information',
      recipientName: 'Recipient Name',
      recipientPhone: 'Recipient Phone',
      recipientMobile: 'Recipient Mobile',
      recipientAddress: 'Recipient Address',
      deliveryAddress: 'Delivery Address',
      fullRecipientName: 'Full Recipient Name',
      recipientMobilePlaceholder: '09123456789',
      fullDeliveryAddress: 'Full Delivery Address',
      
      // Second Address
      secondAddress: 'Second Address',
      secondDeliveryAddress: 'Second Delivery Address',
      secondFullAddress: 'Second Full Address',
      secondCity: 'Second City',
      secondProvince: 'Second Province',
      secondPostalCode: 'Second Postal Code',
      mobileDeliveryRecipient: 'Mobile Delivery Recipient',
      
      // Shipping & Delivery
      shippingMethod: 'Shipping Method',
      selectShippingMethod: 'Select Shipping Method',
      smartSelection: 'Smart Selection',
      deliveryMethod: 'Delivery Method',
      estimatedDelivery: 'Estimated Delivery',
      shippingCost: 'Shipping Cost',
      shippingCostLabel: 'Shipping Cost:',
      freeShipping: 'Free',
      days: 'days',
      vehicleType: 'Vehicle Type',
      calculatingBestVehicle: '🔄 Calculating best vehicle...',
      smartSelectionDetails: '📋 Smart Selection Details:',
      selectedVehicleLabel: '🚛 Selected Vehicle:',
      weightCapacity: '⚖️ Weight Capacity:',
      volumeCapacity: '📦 Volume Capacity:',
      allowedRoutesLabel: '🛣️ Allowed Routes:',
      hazardousTransport: '⚠️ Hazardous Materials Transport',
      refrigeratedTransport: '❄️ Refrigerated Transport',
      fragileHandling: '📱 Suitable for Fragile Items',
      freeShippingOver: '✓ Free shipping for purchases over',
      moreForFreeShipping: 'more for free shipping',
      cubicMeter: 'cubic meters',
      
      // Payment
      paymentInfo: 'Payment Information',
      paymentMethodTitle: 'Payment Method',
      selectPaymentMethod: 'Select Payment Method *',
      selectPaymentPlaceholder: 'Select payment method',
      bankReceiptUpload: 'Bank Receipt Upload',
      onlinePaymentMethod: 'Online Payment',
      walletPayment: 'Wallet Payment',
      walletPaymentTitle: 'Wallet Balance',
      useWallet: 'Use Wallet',
      walletBalance: 'Balance:',
      walletAmountToUse: 'Amount to Use from Wallet (IQD)',
      amountToUse: 'Amount to Use',
      maxAmount: 'Max',
      maximum: 'Maximum',
      amountFromWallet: 'Amount from Wallet:',
      remainingAmount: 'Remaining Amount:',
      remainingBalance: 'Remaining Balance',
      availableFunds: 'available',
      orderFullyPaidByWallet: '✓ Order will be fully paid by wallet - no additional payment needed',
      noAdditionalPaymentNeeded: 'no additional payment needed',
      secondaryPayment: 'Secondary Payment Method',
      selectSecondaryPayment: 'Select Secondary Payment Method',
      
      // Order Notes
      orderNotes: 'Order Notes',
      orderNotesOptional: 'Order Notes (Optional)',
      orderNotesPlaceholder: 'Special delivery instructions or additional information...',
      specialInstructions: 'Special Instructions',
      
      // Actions
      placeOrder: 'Place Order',
      processingOrder: 'Processing Order...',
      continueToPayment: 'Continue to Payment',
      backToShop: 'Back to Shop',
      orderNumber: 'Order Number',
      
      // Purchase Order Summary
      purchaseOrder: 'Purchase Order',
      orderSummary: 'Order Summary',
      productList: 'Product List',
      subtotal: 'Subtotal',
      totalWeight: 'Total Weight',
      shipping: 'Shipping',
      tax: 'Tax',
      discount: 'Discount',
      walletUsed: 'Wallet Used',
      total: 'Total',
      minimize: 'Minimize',
      
      // Cart Management
      cartManagement: 'Cart Management',
      removeItem: 'Remove Item',
      updateQuantity: 'Update Quantity',
      emptyCart: 'Empty Cart',
      
      // Validation Messages
      validEmail: 'Please enter a valid email address',
      minCharacters: 'Must be at least {min} characters',
      minTwoCharacters: 'Minimum 2 characters required',
      validPhone: 'Please enter a valid phone number',
      addressRequired: 'Address is required',
      cityRequired: 'City is required',
      stateRequired: 'State/Province is required',
      postalRequired: 'Postal code is required',
      countryRequired: 'Country is required',
      selectShipping: 'Please select a shipping method',
      selectPayment: 'Please select a payment method',
      
      // Units & Measurements
      kg: 'kg',
      ton: 'ton',
      liter: 'L',
      piece: 'pc',
      iqd: 'IQD',
      usd: 'USD',
      
      // New translations for checkout.tsx
      deliveryTitle: 'Delivery Address',
      useSecondaryAddress: 'Use Secondary Address',
      secondaryAddressSelected: 'Second address selected:',
      cityLabel: 'City',
      recipientInfoTitle: 'Recipient Information',
      recipientInfoLabel: 'Recipient Information',
      recipientInfoNote: 'If the recipient is a different person from the customer, fill in these fields',
      recipientNameLabel: 'Recipient Name',
      recipientNamePlaceholder: 'Full recipient name',
      recipientPhoneLabel: 'Recipient Mobile Number',
      recipientAddressLabel: 'Delivery Address',
      recipientAddressPlaceholder: 'Full delivery address',
      secondAddressOrMobile: 'Second Address or Different Mobile Number',
      secondAddressNote: 'If you need a different address or mobile number for delivery, fill in this section',
      secondAddressOptional: 'Second Address (Optional)',
      hideButton: 'Hide',
      addSecondAddress: 'Add Second Address',
      secondFullAddressLabel: 'Second Full Address',
      secondFullAddressPlaceholder: 'Second full delivery address',
      fullAddressLabel: 'Full Address',
      secondAddressDeliveryPlaceholder: 'Second address for product delivery...',
      provinceLabel: 'Province',
      selectProvincePlaceholder: 'Select Province',
      citySelectLabel: 'City',
      selectCityPlaceholder: 'Select City',
      postalCodeLabel: 'Postal Code',
      postalCodePlaceholder: 'Postal Code',
      differentMobileOptional: 'Different Mobile Number (Optional)',
      differentMobileLabel: 'Different Mobile Number',
      addDifferentNumber: 'Add Different Number',
      recipientMobileLabel: 'Recipient Mobile Number',
      thisNumberForDelivery: 'This number will be used for delivery contact',
      mobileForDeliveryContact: 'This number will be used for delivery contact',
      shippingMethodTitle: 'Shipping Method',
      selectShippingLabel: 'Select Shipping Method * (Smart Selection)',
      selectShippingPlaceholder: 'Select shipping method',
      smartSelectionNote: 'Smart',
      destination: 'Destination:',
      weight: 'Weight:',
      basePrice: 'Base:',
      distance: 'Distance:',
      autoCalculate: 'Auto Calculate',
      specifyDestinationCity: '📍 Please specify destination city',
      addProductsToCart: '⚖️ Add products to cart',
      erbilCity: 'Erbil',
      heavyTruck: 'Heavy',
      flammableSuffix: ' (Flammable Materials)',
      warehouseNoteActive: 'Active address:',
      warehouseNoteSecond: 'Second address',
      warehouseNoteCRM: 'CRM address',
      warehouseNotePhone: 'Active phone:',
      warehouseNoteDifferentMobile: 'Different mobile',
      warehouseNoteCRMPhone: 'CRM phone',
      orderCodeAfterCheckout: 'Order code will be provided after checkout completion',
      productCode: 'Product Code:',
      removeFromCart: 'Remove from cart',
      removedFromCartMsg: 'removed from cart',
      defaultAddressInactive: 'Default Address (Inactive)',
      defaultAddressCRM: 'Default Address (CRM)',
      provinceField: 'Province:',
      cityField: 'City:',
      phoneField: 'Phone:',
      unknown: 'Unknown',
      secondAddressOrDifferentMobile: 'Second Address or Different Mobile Number',
      
      // Order Summary Section
      orderSummaryTitle: 'Order Summary',
      itemCount: 'Item Count:',
      approximateWeight: 'Approximate Weight:',
      defaultDeliveryAddress: 'Default Delivery Address',
      activeDeliveryInfo: 'Active Delivery Address & Information',
      draggableCardMessage: 'Purchase Order card is now fully draggable! Click and drag.',
      smartVehicleSelectionLabel: 'Selected Vehicle (Smart)',
      
      // Draggable Card
      dragging: '🖱️ Dragging...',
      draggable: '🖱️ Draggable',
      dragToMove: 'Click and drag to move the card!',
      
      // Order Details
      orderContainsItems: 'Your purchase order contains {count} items',
      items: 'items',
      orderDate: 'Order Date:',
      
      // Vehicle Selection
      vehicleTypeLabel: 'Vehicle Type:',
      weightCapacityLabel: 'Weight Capacity:',
      destinationLabel: 'Destination:',
      baseCostLabel: 'Base Cost:',
      distanceFromErbil: 'Distance from Erbil:',
      kilometer: 'kilometers',
      autoCalculation: 'Auto calculation based on weight and destination',
      
      // Active Address Info
      activeAddress: 'Active Address:',
      recipientPhoneNumber: 'Recipient Phone Number:',
      infoWillBeUsed: '✅ This information will be used for order delivery',
      addressNotUsed: '⚠️ New address or number specified - This address will not be used',
      defaultAddressNote: '💡 This address will be used as the default delivery address. To change, enter a second address or different mobile number.',
      
      // Form Labels
      secondAddressTitle: 'Second Address or Different Mobile Number',
      differentMobileNumberLabel: 'Different Mobile Number',
      
      // Actions
      continueShoppingBtn: 'Continue Shopping',
      clearCartBtn: 'Clear Cart',
      cartClearedTitle: 'Cart Cleared',
      allProductsRemoved: 'All products removed from cart',
      
      // Payment Summary
      paymentSummaryTitle: 'Payment Summary',
      itemsTotal: 'Items Total:',
      shippingCostSummary: 'Shipping Cost:',
      free: 'Free',
      valueAddedTax: 'Value Added Tax (VAT)',
      valueAddedDuty: 'Value Added Duty',
      walletUsedSummary: 'Wallet Used:',
      totalPayable: 'Total Payable:',
      freeShippingEligible: '🎉 You qualify for free shipping!',
      fullyPaidByWallet: '💳 This order will be fully paid with your wallet',
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
    
    // Product Management
    productManagement: {
      // Validation messages
      categoryRequired: 'Product category is required',
      barcodeRequired: 'Barcode field is required',
      unitPriceRequired: 'Unit price is required',
      stockRequired: 'Stock quantity is required',
      minStockRequired: 'Minimum stock level is required',
      maxStockRequired: 'Maximum stock level is required',
      netWeightRequired: 'Net weight is required',
      grossWeightRequired: 'Gross weight is required',
      grossWeightMinError: 'Gross weight must be greater than or equal to net weight',
      minMaxStockError: 'Minimum stock cannot be greater than maximum stock',
      newBatchNumberRequired: 'Batch number is required for creating new batch',
      
      // Toast messages
      batchDeleted: 'Batch deleted',
      batchDeletedDesc: 'Batch "{batchNumber}" deleted successfully',
      batchDeleteError: 'Error deleting batch',
      batchDeleteErrorDesc: 'Cannot delete batch',
      productUpdated: 'Product updated successfully',
      productUpdateError: 'Product update failed',
      duplicateSKU: 'Duplicate SKU, please enter a new code',
      productDeleted: 'Product deleted successfully and removed from shop',
      productDeleteError: 'Product deletion failed',
      enterNameCategory: 'Please enter product name and category',
      imageUploaded: 'Image {index} uploaded successfully',
      imageUploadError: 'Image upload failed',
      barcodeGenerated: 'Auto barcode generated',
      barcodeGeneratedDesc: 'EAN-13 barcode generated: {barcode}',
      confirmBatchDelete: 'Are you sure you want to delete batch "{batchNumber}"?',
      
      // Form labels and fields
      editProduct: 'Edit existing product information',
      addNewProduct: 'Add new product to catalog',
      nonChemicalProduct: 'Non-chemical product',
      nonChemicalDesc: 'Non-chemical product',
      flammableProduct: 'Flammable product',
      flammableDesc: 'Flammable product',
      baseInfo: 'Basic product information',
      productName: 'Product Name *',
      productNamePlaceholder: 'Enter product name',
      productNameHelp: 'Enter the main product name',
      categoryLabel: 'Category *',
      categoryPlaceholder: 'Select category',
      categoryHelp: 'Product category for better classification and search',
      technicalName: 'Technical Name / Grade',
      technicalNamePlaceholder: 'Technical name or product grade',
      technicalNameHelp: 'Technical name or product grade for display on sales card',
      description: 'Description',
      descriptionPlaceholder: 'Product description...',
      descriptionHelp: 'Complete description about the product, its uses and features',
      identificationPricing: 'Identification & Pricing',
      sku: 'SKU Code',
      skuPlaceholder: 'Product code or use AI',
      skuPlaceholderView: 'Product code (view only)',
      skuHelp: 'Unique product code for system identification',
      skuHelpView: 'Unique product code cannot be changed',
      barcode: 'Barcode',
      barcodePlaceholder: 'Product barcode',
      barcodeHelp: 'Product barcode for scanning and sales',
      unitPrice: 'Unit Price (IQD) *',
      unitPricePlaceholder: '0',
      unitPriceHelp: 'Product sale price per unit',
      stock: 'Stock *',
      stockPlaceholder: '0',
      stockPlaceholderEdit: 'Only in product edit',
      stockHelp: 'Available product quantity in warehouse',
      inventoryAddition: 'Add to inventory',
      inventoryAdditionPlaceholder: '0',
      batchSelection: 'Select Batch for editing',
      batchSelectionPlaceholder: 'Select batch...',
      batchOption: '📦 Batch: {batchNumber} - Stock: {stock}',
      addNewBatch: '➕ Add new batch',
      batchesAvailable: '{count} batches available for barcode {barcode}',
      selectNewBatch: 'To add new batch, select "➕ Add new batch"',
      currentBatchNumber: 'Current batch number',
      newBatchNumber: 'New batch number',
      batchNumberPlaceholder: 'Batch number',
      batchNumberHelp: 'New batch number for catalog',
      batchNumberHelpCurrent: 'Current batch number - stock will be added to this batch',
      stockWillBeAdded: '✅ Stock will be added to this batch',
      minStock: 'Minimum Stock *',
      minStockPlaceholder: '0',
      minStockHelp: 'Minimum stock level for shortage alert',
      maxStock: 'Maximum Stock *',
      maxStockPlaceholder: '0',
      maxStockHelp: 'Maximum warehouse storage capacity for product',
      weightRow: 'Weight row',
      netWeight: 'Net Weight *',
      netWeightPlaceholder: '0',
      netWeightHelp: 'Product net weight without packaging',
      netWeightHelpView: 'Weight can only be changed when creating new product',
      grossWeight: 'Gross Weight',
      grossWeightPlaceholder: '0',
      grossWeightHelp: 'Total product weight with packaging (for transportation)',
      grossWeightHelpView: 'Weight can only be changed when creating new product',
      weightUnit: 'Unit',
      syncWithShop: 'Display in online shop',
      showWhenOutOfStock: 'Show even when out of stock',
      productImages: 'Product Images (Max 3 images)',
      productImagesFromMain: 'Product Images (from main product)',
      imagesHelp: 'Max 3 product images for display in catalog and shop. Supports JPG, PNG, GIF - Max 2MB',
      imagesHelpBatch: 'Images fetched from main product. You can change them if needed.',
      selectPrimaryImage: 'Select primary image:',
      selectPrimaryImageHelp: 'Click the circle button at bottom left of each image (Selected image: {index})',
      selectPrimaryImageHelpDB: 'Images fetched from database and editable (Primary image: {index})',
      imageNumber: 'Image {index}',
      imagePreview: 'Image preview {index}',
      setPrimaryImage: 'Set as primary image {selected}',
      selectImage: 'Select image',
      imageUrlPlaceholder: 'Image URL {index}',
      productCatalog: 'Product Catalog (PDF)',
      catalogHelp: 'Product catalog or brochure in PDF format for additional information',
      catalogFile: 'Catalog file',
      selectCatalog: 'Select catalog',
      catalogName: 'Catalog file name',
      catalogNamePlaceholder: 'catalog.pdf',
      showToCustomers: 'Show to customers',
      catalogURL: 'Catalog URL',
      catalogURLPlaceholder: 'Catalog URL',
      msds: 'MSDS',
      msdsHelp: 'Material Safety Data Sheet for safety information',
      msdsFile: 'MSDS file',
      selectMSDS: 'Select MSDS',
      msdsName: 'MSDS file name',
      msdsNamePlaceholder: 'msds.pdf',
      msdsURL: 'MSDS URL',
      msdsURLPlaceholder: 'MSDS URL',
      updateProduct: 'Update Product',
      addProduct: 'Add Product',
      confirmDelete: 'Confirm product deletion',
      confirmDeleteDesc: 'Are you sure you want to delete product "{name}"?',
      confirmDeleteWarning: 'This action is irreversible and the product will be deleted from both catalog and shop systems.',
      cancel: 'Cancel',
      deleteProduct: 'Delete Product',
      activeBatch: 'Active batch (selling):',
      fifoSystem: 'FIFO System - oldest batch with stock',
      totalStock: 'Total stock: {stock}',
      onlyBatchesWithStock: 'Only batches with stock',
      deleteBatch: 'Delete batch',
      netWeightLabel: 'Net weight:',
      grossWeightLabel: 'Gross weight:',
      weightLabel: 'Weight:',
    },
    
    // Batch Management
    batchManagement: {
      pageTitle: 'Batch Management (FIFO)',
      pageSubtitle: 'Manage product batches with FIFO system',
      searchBatches: 'Search Batches',
      searchDescription: 'Enter product barcode to view all batches',
      barcodeLabel: 'Product Barcode',
      barcodePlaceholder: 'Example: 8649677123456',
      searchButton: 'Search',
      currentSellingBatch: 'Active Selling Batch (LIFO)',
      currentSellingDescription: 'This batch is currently selected for sales',
      batchNumber: 'Batch Number',
      stock: 'Stock',
      stockUnits: 'units',
      productionDate: 'Production Date',
      activeStatus: 'Active',
      totalBatches: 'Total Batches',
      totalStock: 'Total Stock',
      barcode: 'Barcode',
      emptyBatches: 'Empty Batches',
      batchList: 'Batch List (FIFO)',
      batchListDescription: 'Older batches are sold first (First In, First Out)',
      soldOut: 'Sold Out',
      selling: 'Selling',
      waiting: 'Waiting',
      price: 'Price',
      netWeight: 'Net Weight',
      batchNotFound: 'Batch Not Found',
      noBatchesMessage: 'No batches registered for barcode',
      loadingBatches: 'Loading batch information...',
    },
    
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
    rechargeAmount: 'Recharge Amount',
    bankReceipt: 'Bank Receipt',
    rechargeHistory: 'Recharge History',
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
    
    // Wallet Management (Admin)
    walletHolders: 'Wallet Holders',
    walletManagement: 'Wallet Management',
    changeAmount: 'Change Amount',
    reason: 'Reason',
    apply: 'Apply',
    modifyBalance: 'Modify Balance',
    addSubtractAmount: 'Add/Subtract Amount',
    reasonForChange: 'Reason for Change',
    requestRecharge: 'Request Recharge',
    allWalletHolders: 'All customers who have wallets',
    noWalletsFound: 'No wallets found',
    syncWallet: 'Sync Wallet',
    
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
    
    // Auth & Login
    auth: {
      login: 'Login',
      register: 'Register',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot your password?',
      loggingIn: 'Logging in...',
      registering: 'Registering...',
      welcome: 'Welcome',
      loginSuccess: 'Successfully logged in',
      invalidCredentials: 'Invalid email or password',
      loginError: 'Login Error',
      serverError: 'Server connection error. Please try again',
      networkError: 'Network Error',
      networkErrorDesc: 'Connection problem. Please try again.',
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      switchToLogin: 'Switch to Login',
      customerLogin: 'Customer Login',
      signInOrRegister: 'Sign in to your account or create a new one',
      verifyMobileNumber: 'Verify Mobile Number',
      verificationCodeDescription: 'Enter the verification code sent to your mobile',
      smsVerification: 'SMS Verification',
      verificationCodeSent: 'We\'ve sent a 4-digit code to',
      codeSentTo: 'We\'ve sent a code to',
      enterVerificationCode: 'Enter Verification Code',
      enterCodePlaceholder: 'Enter 4-digit code',
      enter4DigitCode: 'Enter 4-digit code',
      fourDigitCode: '4-digit code',
      sixDigitCode: '6-digit code',
      verifying: 'Verifying...',
      verifyCode: 'Verify Code',
      verifyCodes: 'Verify Codes',
      resend: 'Resend',
      back: 'Back',
      basicInformation: 'Basic Information',
      contactInformation: 'Contact Information',
      addressInformation: 'Address Information',
      additionalInformation: 'Additional Information',
      mobileNumber: 'Mobile Number',
      whatsappNumber: 'WhatsApp Number (if different)',
      whatsappDefault: 'Defaults to mobile number',
      whatsappOptional: 'WhatsApp number (optional)',
      leaveEmptyIfSame: 'Leave empty if same as mobile number',
      alternatePhone: 'Alternate Phone',
      province: 'Province',
      selectProvince: 'Select province',
      selectCity: 'Select city',
      selectCountry: 'Select country',
      fullAddress: 'Full address',
      secondaryAddress: 'Secondary Address',
      postalCode: 'Postal Code',
      industry: 'Industry',
      businessType: 'Business Type',
      companySize: 'Company Size',
      manufacturer: 'Manufacturer',
      distributor: 'Distributor',
      retailer: 'Retailer',
      endUser: 'End User',
      small: 'Small (1-50 employees)',
      medium: 'Medium (51-250 employees)',
      large: 'Large (251-1000 employees)',
      enterprise: 'Enterprise (1000+ employees)',
      communicationPreference: 'Communication Preference',
      preferredLanguage: 'Preferred Language',
      english: 'English',
      arabic: 'Arabic',
      persian: 'Persian',
      marketingConsent: 'I agree to receive marketing communications',
      requiredField: 'Required field',
      verificationCodesSent: 'Verification codes sent',
      verificationCodesError: 'Error sending verification codes',
      registrationSuccessful: 'Registration Successful',
      accountCreated: 'Your account has been created successfully',
      registrationError: 'Registration Error',
      invalidCodes: 'Invalid verification codes',
      verificationError: 'Error verifying codes. Please try again',
      smsCodeLabel: 'SMS Verification Code',
      emailCodeLabel: 'Email Verification Code',
      sentTo: 'sent to',
      and: 'and',
      verify: 'Verify',
      emailAlreadyRegistered: 'Email Already Registered',
      emailAlreadyRegisteredDesc: 'This email is already registered. Please login instead.',
      emailAlreadyRegisteredMessage: 'This email is already registered',
      creatingAccount: 'Creating account...',
      createAccount: 'Create Account',
      dualVerification: 'Dual Verification',
      verificationCodesSentTo: 'Verification codes have been sent to',
      profileUpdated: 'Profile Updated',
      profileUpdatedDesc: 'Your profile has been updated successfully',
      updateError: 'Update Error',
      updateFailed: 'Failed to update profile',
      registrationVerificationSent: 'Registration Successful',
      verificationSentDesc: 'A verification code has been sent to your mobile number',
      
      // Validation Messages
      validation: {
        invalidEmail: 'Please enter a valid email',
        passwordMin6: 'Password must be at least 6 characters',
        firstNameMin2: 'First name must be at least 2 characters',
        lastNameMin2: 'Last name must be at least 2 characters',
        phoneMin10: 'Phone number is required',
        countryRequired: 'Country is required',
        provinceRequired: 'Province is required',
        cityRequired: 'City is required',
        addressMin5: 'Address is required',
        passwordsMustMatch: 'Passwords must match',
      },
    },
    
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
    paintThinner: 'Paint Thinner',
    agriculturalFertilizers: 'Agricultural Fertilizers',
    paintSolvents: 'Paint & Solvents',
    industrialChemicals: 'Industrial Chemicals',
    technicalEquipment: 'Technical Equipment',
    commercialGoods: 'Commercial Goods',
    
    // Product category descriptions
    fuelAdditivesDesc: 'High-performance fuel additives for enhanced engine efficiency',
    waterTreatmentDesc: 'Comprehensive water treatment solutions for all applications',
    paintSolventsDesc: 'Premium paint formulations and specialty solvents',
    agriculturalFertilizersDesc: 'Advanced fertilizer solutions for sustainable farming',
    industrialChemicalsDesc: 'Professional industrial chemical solutions',
    paintThinnerDesc: 'Specialty paint thinners and related products',
    technicalEquipmentDesc: 'Professional technical equipment and tools',
    commercialGoodsDesc: 'Commercial goods and business solutions',
    
    // Product Reviews
    productReviews: 'Product Reviews',
    customerReviews: 'Customer Reviews',
    addYourReview: 'Add Your Review',
    writeReview: 'Write Review',
    rating: 'Rating',
    comment: 'Comment',
    customerName: 'Customer Name',
    submitReview: 'Submit Review',
    reviewSubmitted: 'Review Submitted',
    reviewSubmittedDesc: 'Your review has been submitted successfully',
    reviewError: 'Error Submitting Review',
    reviewErrorDesc: 'Error',
    loadingReviews: 'Loading reviews...',
    customerReviewTitle: 'Customer Review about',
    backToShop: 'Back to Shop',
    averageRating: 'Average Rating',
    totalReviews: 'Total Reviews',
    noReviewsYet: 'No Reviews Yet',
    noReviewsDesc: 'Be the first to review this product',
    productSpecifications: 'Specifications',
    reviewsAndRatings: 'Reviews & Ratings',
    customerFeedback: 'Customer Feedback',
    productReviewsFor: 'Product Reviews:',
    totalReviewsCount: 'Total Reviews',
    loginToReview: 'Login to Submit a Review',
    loginToReviewDesc: 'To submit a review and rate products, please login to your account first',
    reviewingAs: 'Reviewing as:',
    yourPreviousReview: 'Your Previous Review:',
    editReview: 'Edit Review',
    postedOn: 'Posted on:',
    editYourReview: 'Edit your review...',
    updateReview: 'Update Review',
    beFirstToReview: 'Be the first to review',
    you: '(You)',
    reviewUpdated: 'Review Updated Successfully',
    reviewUpdatedDesc: 'Your changes have been saved',
    review: 'review',
    reviews: 'reviews',
    
    // Footer
    aboutCompany: 'About Company',
    contactInfo: 'Contact Information',
    followUs: 'Follow Us',
    allRightsReserved: 'All Rights Reserved',
    
    // Home Page - Hero Section
    advancedChemical: 'Advanced Chemical',
    solutions: 'Solutions',
    forIndustry: 'for Industry',
    heroDescription: 'Leading manufacturer of premium fuel additives, water treatment systems, paint & thinner products, and agricultural fertilizers for global industries.',
    exploreProducts: 'Explore Products',
    contactSales: 'Contact Sales',
    
    // Home Page - Products
    ourProductPortfolio: 'Our Product Portfolio',
    productPortfolioDesc: 'Comprehensive chemical solutions across four key industries, engineered for performance and reliability.',
    products_plural: 'Products',
    availableProducts: 'Available Products:',
    moreProducts: 'more products',
    viewAll: 'View All',
    aboutMomtazchem: 'About Momtazchem',
    aboutMomtazchemDesc1: 'With over 25 years of excellence in chemical manufacturing, Momtazchem has established itself as a trusted partner for industries worldwide. Our commitment to innovation, quality, and sustainability drives everything we do.',
    aboutMomtazchemDesc2: 'From our state-of-the-art facilities, we develop and produce high-quality chemical solutions that meet the evolving needs of fuel, water treatment, paint, and agricultural industries.',
    learnMoreAboutUs: 'Learn More About Us',
    customerSatisfaction: 'Customer Satisfaction',
    ourServicesCapabilities: 'Our Services & Capabilities',
    servicesCapabilitiesDesc: 'Comprehensive support from research and development to delivery and technical assistance.',
    rdServices: 'R&D Services',
    rdServicesDesc: 'Custom formulation development and product optimization to meet specific industry requirements.',
    customFormulations: 'Custom Formulations',
    productTesting: 'Product Testing',
    performanceAnalysis: 'Performance Analysis',
    globalDistribution: 'Global Distribution',
    globalDistributionDesc: 'Reliable supply chain and logistics network ensuring timely delivery worldwide.',
    countries40Plus: '40+ Countries',
    expressShipping: 'Express Shipping',
    bulkOrders: 'Bulk Orders',
    technicalSupport: 'Technical Support',
    technicalSupportDesc: 'Expert technical assistance and consultation for optimal product application and performance.',
    support24_7: '24/7 Support',
    applicationTraining: 'Application Training',
    documentation: 'Documentation',
    
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
    sustainability: 'Sustainability',
    sustainabilityDesc: 'Committed to sustainable practices and environmentally responsible solutions',
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
    
    // Certifications
    iso9001: 'ISO 9001:2015',
    iso9001Desc: 'Quality Management Systems',
    iso14001: 'ISO 14001',
    iso14001Desc: 'Environmental Management',
    ohsas18001: 'OHSAS 18001',
    ohsas18001Desc: 'Occupational Health & Safety',
    reachCompliance: 'REACH Compliance',
    reachComplianceDesc: 'European Chemicals Regulation',
    
    // Product Form
    productManagement: 'Product Management',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    shortDescription: 'Short Description',
    productDescription: 'Product Description',
    priceRange: 'Price Range',
    productCategory: 'Product Category',
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
    
    // Contact Page
    contactPage: {
      // Form Labels
      firstName: 'First Name',
      lastName: 'Last Name',
      emailAddress: 'Email Address',
      company: 'Company',
      productInterest: 'Product Interest',
      message: 'Message',
      
      // Form Placeholders
      firstNamePlaceholder: 'John',
      lastNamePlaceholder: 'Doe',
      emailPlaceholder: 'john@company.com',
      companyPlaceholder: 'Your Company',
      productInterestPlaceholder: 'Select a product category',
      messagePlaceholder: 'Tell us about your requirements...',
      
      // Product Categories
      waterTreatment: 'Water Treatment',
      fuelAdditives: 'Fuel Additives',
      paintThinner: 'Paint & Thinner',
      agriculturalFertilizers: 'Agricultural Fertilizers',
      industrialChemicals: 'Industrial Chemicals',
      technicalEquipment: 'Technical Equipment',
      commercialGoods: 'Commercial Goods',
      customSolutions: 'Custom Solutions',
      
      // Buttons
      sending: 'Sending...',
      sendMessage: 'Send Message',
      
      // Toast Messages
      messageSent: 'Message Sent Successfully',
      messageSentDesc: 'Thank you for your inquiry. We will get back to you within 24 hours.',
      errorTitle: 'Error',
      errorDesc: 'Failed to send message. Please try again.',
      
      // Sections
      contactInformation: 'Contact Information',
      ourCertifications: 'Our Certifications',
      findUs: 'Find Us',
      visitHeadquarters: 'Visit our headquarters and manufacturing facilities',
      getDirections: 'Get Directions',
      viewInMaps: 'View in Google Maps',
    },
    
    // Services Page
    servicesPage: {
      title: 'Our Services & Capabilities',
      subtitle: 'Comprehensive support from research and development to delivery and technical assistance, ensuring your success every step of the way.',
      
      rdTitle: 'Research & Development',
      rdDesc: 'Custom formulation development and product optimization to meet your specific requirements.',
      rdFeature1: 'Custom Chemical Formulations',
      rdFeature2: 'Product Performance Testing',
      rdFeature3: 'Regulatory Compliance Support',
      rdFeature4: 'Scale-up from Lab to Production',
      rdFeature5: 'Quality Optimization',
      rdFeature6: 'Application Development',
      
      distributionTitle: 'Global Distribution',
      distributionDesc: 'Reliable supply chain and logistics network ensuring timely delivery worldwide.',
      distFeature1: '40+ Countries Coverage',
      distFeature2: 'Express Shipping Options',
      distFeature3: 'Bulk Order Handling',
      distFeature4: 'Cold Chain Management',
      distFeature5: 'Real-time Tracking',
      distFeature6: 'Local Warehousing',
      
      techSupportTitle: 'Technical Support',
      techSupportDesc: 'Expert technical assistance and consultation for optimal product application.',
      techFeature1: '24/7 Technical Helpline',
      techFeature2: 'Application Training',
      techFeature3: 'Troubleshooting Support',
      techFeature4: 'Performance Optimization',
      techFeature5: 'Safety Guidelines',
      techFeature6: 'Documentation Support',
      
      consultingTitle: 'Consulting Services',
      consultingDesc: 'Strategic consulting to help optimize your chemical processes and operations.',
      consultFeature1: 'Process Optimization',
      consultFeature2: 'Cost Reduction Analysis',
      consultFeature3: 'Sustainability Assessment',
      consultFeature4: 'Regulatory Guidance',
      consultFeature5: 'Market Analysis',
      consultFeature6: 'Strategic Planning',
      
      qaTitle: 'Quality Assurance',
      qaDesc: 'Comprehensive quality control and assurance programs for all our products.',
      qaFeature1: 'ISO Certified Processes',
      qaFeature2: 'Batch Testing & Analysis',
      qaFeature3: 'Certificate of Analysis',
      qaFeature4: 'Quality Documentation',
      qaFeature5: 'Regulatory Compliance',
      qaFeature6: 'Continuous Monitoring',
      
      customMfgTitle: 'Custom Manufacturing',
      customMfgDesc: 'Tailored manufacturing solutions for specialized chemical requirements.',
      customFeature1: 'Contract Manufacturing',
      customFeature2: 'Private Labeling',
      customFeature3: 'Flexible Batch Sizes',
      customFeature4: 'Specialty Formulations',
      customFeature5: 'Packaging Solutions',
      customFeature6: 'Supply Chain Integration',
      
      coreCapabilities: 'Our Core Capabilities',
      coreCapabilitiesDesc: 'Backed by decades of experience and cutting-edge technology',
      advManufacturing: 'Advanced Manufacturing',
      advManufacturingDesc: 'State-of-the-art facilities with modern equipment and automation',
      qualityControl: 'Quality Control',
      qualityControlDesc: 'Rigorous testing and quality assurance at every stage',
      globalReachCap: 'Global Reach',
      globalReachCapDesc: 'Serving customers in over 40 countries worldwide',
      expertTeam: 'Expert Team',
      expertTeamDesc: '50+ R&D scientists and chemical engineering experts',
      
      serviceProcess: 'Our Service Process',
      serviceProcessDesc: 'From initial consultation to ongoing support, we\'re with you every step of the way',
      consultation: 'Consultation',
      consultationDesc: 'Understanding your specific requirements and challenges',
      development: 'Development',
      developmentDesc: 'Custom formulation and solution development',
      testing: 'Testing',
      testingDesc: 'Rigorous testing and quality validation',
      delivery: 'Delivery',
      deliveryDesc: 'Production, delivery, and ongoing support',
      
      readyToStart: 'Ready to Get Started?',
      contactExpertsDesc: 'Contact our team of experts to discuss your chemical solution needs and discover how we can help your business succeed.',
      contactSales: 'Contact Sales Team',
      requestQuote: 'Request Quote',
      
      contactSalesTitle: 'Contact Sales Team',
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      companyName: 'Company',
      phoneNumber: 'Phone Number',
      message: 'Message',
      messagePlaceholder: 'Tell us about your requirements...',
      cancel: 'Cancel',
      sendMessage: 'Send Message',
      sending: 'Sending...',
      
      requestQuoteTitle: 'Request Quote',
      productCategory: 'Product Category',
      productCategoryPlaceholder: 'e.g., Agricultural Fertilizers, Water Treatment, etc.',
      requiredQuantity: 'Required Quantity',
      quantityPlaceholder: 'e.g., 500 kg, 10 tons',
      requiredTimeline: 'Required Timeline',
      timelinePlaceholder: 'e.g., Within 2 weeks',
      productSpecs: 'Product Specifications',
      specsPlaceholder: 'Please provide detailed specifications, purity requirements, packaging preferences, etc.',
      additionalReqs: 'Additional Requirements',
      additionalPlaceholder: 'Any additional information or special requirements...',
      submitQuote: 'Submit Quote Request',
      submitting: 'Submitting...',
      
      messageSent: 'Message Sent Successfully',
      messageSentDesc: 'Our sales team will contact you within 24 hours.',
      quoteSubmitted: 'Quote Request Submitted',
      quoteSubmittedDesc: 'Our team will prepare your quote and respond within 24 hours.',
      errorTitle: 'Error',
      messageFailed: 'Failed to send message. Please try again.',
      quoteFailed: 'Failed to submit quote request. Please try again.',
    },
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
      maxPrice: 'الحد الأقصى',
      inStock: 'متوفر',
      outOfStock: 'غير متوفر',
      volumeDeals: 'عروض الكمية',
      active: 'نشط',
      off: 'خصم',
      more: 'إضافية',
      items: 'قطع',
      max: 'أقصى',
      buy: 'اشترِ',
      catalog: 'الكتالوج',
      addToCart: 'إضافة للسلة',
      addMore: 'إضافة المزيد',
      notAvailable: 'غير متوفر',
      insufficientStock: 'مخزون غير كافٍ',
      maxStockInCart: 'الحد الأقصى من المخزون موجود في السلة',
      onlyXAvailable: 'متوفر فقط {count} وحدة من هذا المنتج',
      onlyXLeft: 'تبقى فقط {count} وحدة!',
      productReviews: 'التقييمات والمراجعات',
      technicalSpecs: 'المواصفات الفنية',
      hideWalletBalance: 'إخفاء رصيد المحفظة',
      showWalletBalance: 'عرض رصيد المحفظة',
      addedToCart: 'تمت الإضافة للسلة',
      addedToCartDesc: 'تمت إضافة {count} وحدة من {product} للسلة',
      welcome: 'مرحباً',
      registrationSuccessful: 'التسجيل ناجح',
      welcomeMessage: 'مرحباً {name}',
      logoutSuccessful: 'تم تسجيل الخروج',
      logoutMessage: 'تم تسجيل الخروج بنجاح',
      error: 'خطأ',
      logoutError: 'خطأ في تسجيل الخروج',
      loginSuccessful: 'تم تسجيل الدخول',
      loginWelcome: 'مرحباً بعودتك! يمكنك الآن إتمام الطلب',
      unit: 'وحدة',
      units: 'وحدات',
      
      // Filters & Sorting
      filters: 'الفلاتر',
      searchProducts: 'البحث عن المنتجات',
      searchProductsPlaceholder: '...ابحث عن المنتجات',
      sortBy: 'ترتيب حسب',
      relevance: 'الأكثر صلة',
      name: 'الاسم',
      categories: 'التصنيفات',
      priceRange: 'نطاق السعر',
      clearAllFilters: 'مسح جميع الفلاتر',
      clearFilters: 'مسح جميع الفلاتر',
      ascending: 'تصاعدي',
      descending: 'تنازلي',
      highToLow: 'من الأعلى للأقل',
      lowToHigh: 'من الأقل للأعلى',
      aToZ: 'أ-ي',
      zToA: 'ي-أ',
      availability: 'التوفر',
      inStockOnly: 'المتوفر فقط',
      newest: 'الأحدث',
      showingProducts: 'عرض',
      page: 'صفحة',
      of: 'من',
      product: 'منتج',
      products: 'منتجات',
    },

    // Blog page
    blog: {
      title: 'مدونة - رؤى صناعة المواد الكيميائية',
      subtitle: 'أحدث المقالات والأدلة والرؤى حول الحلول الكيميائية ومضافات الوقود ومعالجة المياه والمواد الكيميائية الصناعية',
      searchPlaceholder: 'البحث في المقالات حسب العنوان أو المحتوى...',
      allTags: 'جميع العلامات',
      readMore: 'اقرأ المزيد',
      by: 'بواسطة',
      views: 'مشاهدة',
      noPostsFound: 'لم يتم العثور على مقالات',
      noPostsMessage: 'لم نتمكن من العثور على أي مقالات تطابق معاييرك. حاول ضبط البحث أو الفلاتر.',
      loadingPosts: 'جاري تحميل المقالات...',
      previousPage: 'السابق',
      nextPage: 'التالي',
      page: 'صفحة',
      of: 'من',
    },

    // Blog post page
    blogPost: {
      loading: 'جاري تحميل المقال...',
      notFound: 'المقال غير موجود',
      notFoundMessage: 'المقال الذي تبحث عنه غير موجود أو تم حذفه.',
      backToBlog: 'العودة للمدونة',
      shareArticle: 'مشاركة المقال',
      copyLink: 'نسخ الرابط',
      linkCopied: 'تم نسخ الرابط!',
      linkCopiedMessage: 'تم نسخ رابط المقال إلى الحافظة.',
      tableOfContents: 'جدول المحتويات',
      aboutAuthor: 'عن الكاتب',
      relatedPosts: 'مقالات ذات صلة',
      noRelatedPosts: 'لم يتم العثور على مقالات ذات صلة.',
      readingTime: 'وقت القراءة',
      minutes: 'دقيقة',
      publishedOn: 'نشر في',
      updatedOn: 'آخر تحديث',
      previousPost: 'المقال السابق',
      nextPost: 'المقال التالي',
      tags: 'العلامات',
      share: 'مشاركة',
    },

    // Checkout page
    checkout_page: {
      // Page titles & headers
      welcomeTitle: 'مرحباً بك في صفحة الدفع',
      orderPlacedSuccess: 'تم تقديم الطلب بنجاح!',
      orderFailed: 'فشل الطلب',
      orderFailedDesc: 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
      
      // Customer Information
      customerInfo: 'معلومات العميل',
      firstName: 'الاسم الأول',
      lastName: 'الاسم الأخير',
      emailAddress: 'عنوان البريد الإلكتروني',
      phoneNumber: 'رقم الهاتف',
      company: 'الشركة',
      required: '*',
      
      // Address Fields
      billingAddress: 'عنوان الفواتير',
      shippingAddress: 'عنوان الشحن',
      fullAddress: 'العنوان الكامل',
      addressLine1: 'سطر العنوان 1',
      addressLine2: 'سطر العنوان 2',
      city: 'المدينة',
      state: 'الولاية/المحافظة',
      province: 'المحافظة',
      postalCode: 'الرمز البريدي',
      country: 'الدولة',
      selectProvince: 'اختر المحافظة',
      selectCity: 'اختر المدينة',
      selectProvinceFirst: 'اختر المحافظة أولاً',
      
      // Recipient Information
      recipientInfo: 'معلومات المستلم',
      recipientName: 'اسم المستلم',
      recipientPhone: 'هاتف المستلم',
      recipientMobile: 'موبايل المستلم',
      recipientAddress: 'عنوان المستلم',
      deliveryAddress: 'عنوان التسليم',
      fullRecipientName: 'الاسم الكامل للمستلم',
      recipientMobilePlaceholder: '09123456789',
      fullDeliveryAddress: 'عنوان التسليم الكامل',
      
      // Second Address
      secondAddress: 'العنوان الثاني',
      secondDeliveryAddress: 'عنوان التسليم الثاني',
      secondFullAddress: 'العنوان الكامل الثاني',
      secondCity: 'المدينة الثانية',
      secondProvince: 'المحافظة الثانية',
      secondPostalCode: 'الرمز البريدي الثاني',
      mobileDeliveryRecipient: 'موبايل المستلم',
      
      // Shipping & Delivery
      shippingMethod: 'طريقة الشحن',
      selectShippingMethod: 'اختر طريقة الشحن',
      smartSelection: 'الاختيار الذكي',
      deliveryMethod: 'طريقة التوصيل',
      estimatedDelivery: 'التسليم المتوقع',
      shippingCost: 'تكلفة الشحن',
      shippingCostLabel: 'تكلفة الشحن:',
      freeShipping: 'مجاني',
      days: 'أيام',
      vehicleType: 'نوع المركبة',
      calculatingBestVehicle: '🔄 جاري حساب أفضل مركبة...',
      smartSelectionDetails: '📋 تفاصيل الاختيار الذكي:',
      selectedVehicleLabel: '🚛 المركبة المختارة:',
      weightCapacity: '⚖️ سعة الوزن:',
      volumeCapacity: '📦 السعة الحجمية:',
      allowedRoutesLabel: '🛣️ الطرق المسموحة:',
      hazardousTransport: '⚠️ نقل المواد الخطرة',
      refrigeratedTransport: '❄️ نقل مبرد',
      fragileHandling: '📱 مناسب للأشياء الهشة',
      freeShippingOver: '✓ شحن مجاني للمشتريات فوق',
      moreForFreeShipping: 'المزيد للشحن المجاني',
      cubicMeter: 'متر مكعب',
      
      // Payment
      paymentInfo: 'معلومات الدفع',
      paymentMethodTitle: 'طريقة الدفع',
      selectPaymentMethod: 'اختر طريقة الدفع *',
      selectPaymentPlaceholder: 'اختر طريقة الدفع',
      bankReceiptUpload: 'تحميل إيصال البنك',
      onlinePaymentMethod: 'الدفع عبر الإنترنت',
      walletPayment: 'الدفع عبر المحفظة',
      walletPaymentTitle: 'رصيد المحفظة',
      useWallet: 'استخدام المحفظة',
      walletBalance: 'الرصيد:',
      walletAmountToUse: 'المبلغ المستخدم من المحفظة (دينار)',
      amountToUse: 'المبلغ المستخدم',
      maxAmount: 'الحد الأقصى',
      maximum: 'الحد الأقصى',
      amountFromWallet: 'المبلغ من المحفظة:',
      remainingAmount: 'المبلغ المتبقي:',
      remainingBalance: 'الرصيد المتبقي',
      availableFunds: 'متوفر',
      orderFullyPaidByWallet: '✓ سيتم دفع الطلب بالكامل من المحفظة - لا حاجة لدفع إضافي',
      noAdditionalPaymentNeeded: 'لا حاجة لدفع إضافي',
      secondaryPayment: 'طريقة الدفع الثانوية',
      selectSecondaryPayment: 'اختر طريقة الدفع الثانوية',
      
      // Order Notes
      orderNotes: 'ملاحظات الطلب',
      orderNotesOptional: 'ملاحظات الطلب (اختياري)',
      orderNotesPlaceholder: 'تعليمات خاصة بالتسليم أو معلومات إضافية...',
      specialInstructions: 'تعليمات خاصة',
      
      // Actions
      placeOrder: 'تأكيد الطلب',
      processingOrder: 'جاري معالجة الطلب...',
      continueToPayment: 'المتابعة للدفع',
      backToShop: 'العودة للمتجر',
      orderNumber: 'رقم الطلب',
      
      // Purchase Order Summary
      purchaseOrder: 'طلب الشراء',
      orderSummary: 'ملخص الطلب',
      productList: 'قائمة المنتجات',
      subtotal: 'المجموع الفرعي',
      totalWeight: 'الوزن الكلي',
      shipping: 'الشحن',
      tax: 'الضريبة',
      discount: 'الخصم',
      walletUsed: 'المحفظة المستخدمة',
      total: 'الإجمالي',
      minimize: 'تصغير',
      
      // Cart Management
      cartManagement: 'إدارة السلة',
      removeItem: 'إزالة المنتج',
      updateQuantity: 'تحديث الكمية',
      emptyCart: 'سلة فارغة',
      
      // Validation Messages
      validEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح',
      minCharacters: 'يجب أن يكون على الأقل {min} حرفاً',
      minTwoCharacters: 'يجب أن يكون على الأقل حرفين',
      validPhone: 'يرجى إدخال رقم هاتف صالح',
      addressRequired: 'العنوان مطلوب',
      cityRequired: 'المدينة مطلوبة',
      stateRequired: 'الولاية/المحافظة مطلوبة',
      postalRequired: 'الرمز البريدي مطلوب',
      countryRequired: 'الدولة مطلوبة',
      selectShipping: 'يرجى اختيار طريقة الشحن',
      selectPayment: 'يرجى اختيار طريقة الدفع',
      
      // Units & Measurements
      kg: 'كغ',
      ton: 'طن',
      liter: 'لتر',
      piece: 'قطعة',
      iqd: 'دينار',
      usd: 'دولار',
      
      // New translations for checkout.tsx
      deliveryTitle: 'عنوان التسليم',
      useSecondaryAddress: 'استخدام العنوان الثانوي',
      secondaryAddressSelected: 'تم اختيار العنوان الثاني:',
      cityLabel: 'المدينة',
      recipientInfoTitle: 'معلومات المستلم',
      recipientInfoLabel: 'معلومات المستلم',
      recipientInfoNote: 'إذا كان المستلم شخصاً مختلفاً عن العميل، املأ هذه الحقول',
      recipientNameLabel: 'اسم المستلم',
      recipientNamePlaceholder: 'الاسم الكامل للمستلم',
      recipientPhoneLabel: 'رقم موبايل المستلم',
      recipientAddressLabel: 'عنوان التسليم',
      recipientAddressPlaceholder: 'عنوان التسليم الكامل',
      secondAddressOrMobile: 'عنوان ثاني أو رقم موبايل مختلف',
      secondAddressNote: 'إذا كنت بحاجة إلى عنوان أو رقم موبايل مختلف للتسليم، املأ هذا القسم',
      secondAddressOptional: 'العنوان الثاني (اختياري)',
      hideButton: 'إخفاء',
      addSecondAddress: 'إضافة عنوان ثاني',
      secondFullAddressLabel: 'العنوان الكامل الثاني',
      secondFullAddressPlaceholder: 'عنوان التسليم الكامل الثاني',
      fullAddressLabel: 'العنوان الكامل',
      secondAddressDeliveryPlaceholder: 'العنوان الثاني لتسليم المنتجات...',
      provinceLabel: 'المحافظة',
      selectProvincePlaceholder: 'اختر المحافظة',
      citySelectLabel: 'المدينة',
      selectCityPlaceholder: 'اختر المدينة',
      postalCodeLabel: 'الرمز البريدي',
      postalCodePlaceholder: 'الرمز البريدي',
      differentMobileOptional: 'رقم موبايل مختلف (اختياري)',
      differentMobileLabel: 'رقم موبايل مختلف',
      addDifferentNumber: 'إضافة رقم مختلف',
      recipientMobileLabel: 'رقم موبايل المستلم',
      thisNumberForDelivery: 'سيتم استخدام هذا الرقم للاتصال بالتسليم',
      mobileForDeliveryContact: 'سيتم استخدام هذا الرقم للاتصال بالتسليم',
      shippingMethodTitle: 'طريقة الشحن',
      selectShippingLabel: 'اختر طريقة الشحن * (الاختيار الذكي)',
      selectShippingPlaceholder: 'اختر طريقة الشحن',
      smartSelectionNote: 'ذكي',
      destination: 'الوجهة:',
      weight: 'الوزن:',
      basePrice: 'السعر الأساسي:',
      distance: 'المسافة:',
      autoCalculate: 'حساب تلقائي',
      specifyDestinationCity: '📍 الرجاء تحديد مدينة الوجهة',
      addProductsToCart: '⚖️ أضف منتجات إلى السلة',
      erbilCity: 'أربيل',
      heavyTruck: 'ثقيل',
      flammableSuffix: ' (مواد قابلة للاشتعال)',
      warehouseNoteActive: 'العنوان النشط:',
      warehouseNoteSecond: 'العنوان الثاني',
      warehouseNoteCRM: 'عنوان CRM',
      warehouseNotePhone: 'الهاتف النشط:',
      warehouseNoteDifferentMobile: 'موبايل مختلف',
      warehouseNoteCRMPhone: 'هاتف CRM',
      orderCodeAfterCheckout: 'سيتم تقديم رمز الطلب بعد إتمام الدفع',
      productCode: 'رمز المنتج:',
      removeFromCart: 'إزالة من السلة',
      removedFromCartMsg: 'تمت الإزالة من السلة',
      defaultAddressInactive: 'العنوان الافتراضي (غير نشط)',
      defaultAddressCRM: 'العنوان الافتراضي (CRM)',
      provinceField: 'المحافظة:',
      cityField: 'المدينة:',
      phoneField: 'الهاتف:',
      unknown: 'غير معروف',
      secondAddressOrDifferentMobile: 'عنوان ثاني أو رقم موبايل مختلف',
      
      // Order Summary Section
      orderSummaryTitle: 'ملخص الطلب',
      itemCount: 'عدد العناصر:',
      approximateWeight: 'الوزن التقريبي:',
      defaultDeliveryAddress: 'عنوان التسليم الافتراضي',
      activeDeliveryInfo: 'عنوان ومعلومات التسليم النشطة',
      draggableCardMessage: 'بطاقة أمر الشراء قابلة للسحب الآن! انقر واسحب.',
      smartVehicleSelectionLabel: 'المركبة المحددة (ذكية)',
      
      // Draggable Card
      dragging: '🖱️ جاري السحب...',
      draggable: '🖱️ قابل للسحب',
      dragToMove: 'انقر واسحب لنقل البطاقة!',
      
      // Order Details
      orderContainsItems: 'يحتوي طلب الشراء الخاص بك على {count} عناصر',
      items: 'عناصر',
      orderDate: 'تاريخ الطلب:',
      
      // Vehicle Selection
      vehicleTypeLabel: 'نوع المركبة:',
      weightCapacityLabel: 'سعة الوزن:',
      destinationLabel: 'الوجهة:',
      baseCostLabel: 'التكلفة الأساسية:',
      distanceFromErbil: 'المسافة من أربيل:',
      kilometer: 'كيلومترات',
      autoCalculation: 'حساب تلقائي بناءً على الوزن والوجهة',
      
      // Active Address Info
      activeAddress: 'العنوان النشط:',
      recipientPhoneNumber: 'رقم هاتف المستلم:',
      infoWillBeUsed: '✅ سيتم استخدام هذه المعلومات لتسليم الطلب',
      addressNotUsed: '⚠️ تم تحديد عنوان أو رقم جديد - لن يتم استخدام هذا العنوان',
      defaultAddressNote: '💡 سيتم استخدام هذا العنوان كعنوان التسليم الافتراضي. للتغيير، أدخل عنوانًا ثانيًا أو رقم موبايل مختلف.',
      
      // Form Labels
      secondAddressTitle: 'عنوان ثاني أو رقم موبايل مختلف',
      differentMobileNumberLabel: 'رقم موبايل مختلف',
      
      // Actions
      continueShoppingBtn: 'متابعة التسوق',
      clearCartBtn: 'مسح السلة',
      cartClearedTitle: 'تم مسح السلة',
      allProductsRemoved: 'تمت إزالة جميع المنتجات من السلة',
      
      // Payment Summary
      paymentSummaryTitle: 'ملخص الدفع',
      itemsTotal: 'إجمالي العناصر:',
      shippingCostSummary: 'تكلفة الشحن:',
      free: 'مجاني',
      valueAddedTax: 'ضريبة القيمة المضافة',
      valueAddedDuty: 'رسوم القيمة المضافة',
      walletUsedSummary: 'المحفظة المستخدمة:',
      totalPayable: 'إجمالي المبلغ المستحق:',
      freeShippingEligible: '🎉 أنت مؤهل للشحن المجاني!',
      fullyPaidByWallet: '💳 سيتم دفع هذا الطلب بالكامل من محفظتك',
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
    
    // Product Management
    productManagement: {
      // Validation messages
      categoryRequired: 'فئة المنتج مطلوبة',
      barcodeRequired: 'حقل الباركود مطلوب',
      unitPriceRequired: 'سعر الوحدة مطلوب',
      stockRequired: 'كمية المخزون مطلوبة',
      minStockRequired: 'الحد الأدنى للمخزون مطلوب',
      maxStockRequired: 'الحد الأقصى للمخزون مطلوب',
      netWeightRequired: 'الوزن الصافي مطلوب',
      grossWeightRequired: 'الوزن الإجمالي مطلوب',
      grossWeightMinError: 'يجب أن يكون الوزن الإجمالي أكبر من أو يساوي الوزن الصافي',
      minMaxStockError: 'لا يمكن أن يكون الحد الأدنى للمخزون أكبر من الحد الأقصى',
      newBatchNumberRequired: 'رقم الدفعة مطلوب لإنشاء دفعة جديدة',
      
      // Toast messages
      batchDeleted: 'تم حذف الدفعة',
      batchDeletedDesc: 'تم حذف الدفعة "{batchNumber}" بنجاح',
      batchDeleteError: 'خطأ في حذف الدفعة',
      batchDeleteErrorDesc: 'لا يمكن حذف الدفعة',
      productUpdated: 'تم تحديث المنتج بنجاح',
      productUpdateError: 'فشل تحديث المنتج',
      duplicateSKU: 'رمز SKU مكرر، يرجى إدخال رمز جديد',
      productDeleted: 'تم حذف المنتج بنجاح وإزالته من المتجر',
      productDeleteError: 'فشل حذف المنتج',
      enterNameCategory: 'يرجى إدخال اسم المنتج والفئة',
      imageUploaded: 'تم رفع الصورة {index} بنجاح',
      imageUploadError: 'فشل رفع الصورة',
      barcodeGenerated: 'تم إنشاء الباركود تلقائياً',
      barcodeGeneratedDesc: 'تم إنشاء باركود EAN-13: {barcode}',
      confirmBatchDelete: 'هل أنت متأكد أنك تريد حذف الدفعة "{batchNumber}"؟',
      
      // Form labels and fields
      editProduct: 'تحرير معلومات المنتج الحالي',
      addNewProduct: 'إضافة منتج جديد إلى الكتالوج',
      nonChemicalProduct: 'منتج غير كيميائي',
      nonChemicalDesc: 'منتج غير كيميائي',
      flammableProduct: 'منتج قابل للاشتعال',
      flammableDesc: 'منتج قابل للاشتعال',
      baseInfo: 'المعلومات الأساسية للمنتج',
      productName: 'اسم المنتج *',
      productNamePlaceholder: 'أدخل اسم المنتج',
      productNameHelp: 'أدخل الاسم الرئيسي للمنتج',
      categoryLabel: 'الفئة *',
      categoryPlaceholder: 'اختر الفئة',
      categoryHelp: 'فئة المنتج للتصنيف والبحث الأفضل',
      technicalName: 'الاسم الفني / الدرجة',
      technicalNamePlaceholder: 'الاسم الفني أو درجة المنتج',
      technicalNameHelp: 'الاسم الفني أو درجة المنتج للعرض على بطاقة المبيعات',
      description: 'الوصف',
      descriptionPlaceholder: 'وصف المنتج...',
      descriptionHelp: 'وصف كامل عن المنتج واستخداماته ومميزاته',
      identificationPricing: 'التعريف والتسعير',
      sku: 'رمز SKU',
      skuPlaceholder: 'رمز المنتج أو استخدم AI',
      skuPlaceholderView: 'رمز المنتج (عرض فقط)',
      skuHelp: 'رمز منتج فريد للتعريف في النظام',
      skuHelpView: 'لا يمكن تغيير رمز المنتج الفريد',
      barcode: 'الباركود',
      barcodePlaceholder: 'باركود المنتج',
      barcodeHelp: 'باركود المنتج للمسح والمبيعات',
      unitPrice: 'سعر الوحدة (دينار) *',
      unitPricePlaceholder: '0',
      unitPriceHelp: 'سعر بيع المنتج لكل وحدة',
      stock: 'المخزون *',
      stockPlaceholder: '0',
      stockPlaceholderEdit: 'فقط في تحرير المنتج',
      stockHelp: 'كمية المنتج المتاحة في المستودع',
      inventoryAddition: 'إضافة إلى المخزون',
      inventoryAdditionPlaceholder: '0',
      batchSelection: 'اختر الدفعة للتحرير',
      batchSelectionPlaceholder: 'اختر الدفعة...',
      batchOption: '📦 دفعة: {batchNumber} - مخزون: {stock}',
      addNewBatch: '➕ إضافة دفعة جديدة',
      batchesAvailable: '{count} دفعات متاحة للباركود {barcode}',
      selectNewBatch: 'لإضافة دفعة جديدة، اختر "➕ إضافة دفعة جديدة"',
      currentBatchNumber: 'رقم الدفعة الحالية',
      newBatchNumber: 'رقم الدفعة الجديدة',
      batchNumberPlaceholder: 'رقم الدفعة',
      batchNumberHelp: 'رقم الدفعة الجديدة للكتالوج',
      batchNumberHelpCurrent: 'رقم الدفعة الحالية - سيتم إضافة المخزون إلى هذه الدفعة',
      stockWillBeAdded: '✅ سيتم إضافة المخزون إلى هذه الدفعة',
      minStock: 'الحد الأدنى للمخزون *',
      minStockPlaceholder: '0',
      minStockHelp: 'الحد الأدنى لمستوى المخزون للتنبيه بالنقص',
      maxStock: 'الحد الأقصى للمخزون *',
      maxStockPlaceholder: '0',
      maxStockHelp: 'الحد الأقصى لسعة التخزين في المستودع للمنتج',
      weightRow: 'صف الوزن',
      netWeight: 'الوزن الصافي *',
      netWeightPlaceholder: '0',
      netWeightHelp: 'وزن المنتج الصافي بدون التعبئة',
      netWeightHelpView: 'لا يمكن تغيير الوزن إلا عند إنشاء منتج جديد',
      grossWeight: 'الوزن الإجمالي',
      grossWeightPlaceholder: '0',
      grossWeightHelp: 'الوزن الإجمالي للمنتج مع التعبئة (للنقل)',
      grossWeightHelpView: 'لا يمكن تغيير الوزن إلا عند إنشاء منتج جديد',
      weightUnit: 'الوحدة',
      syncWithShop: 'العرض في المتجر الإلكتروني',
      showWhenOutOfStock: 'العرض حتى عند نفاد المخزون',
      productImages: 'صور المنتج (بحد أقصى 3 صور)',
      productImagesFromMain: 'صور المنتج (من المنتج الرئيسي)',
      imagesHelp: 'حد أقصى 3 صور للمنتج للعرض في الكتالوج والمتجر. يدعم JPG, PNG, GIF - بحد أقصى 2MB',
      imagesHelpBatch: 'تم جلب الصور من المنتج الرئيسي. يمكنك تغييرها إذا لزم الأمر.',
      selectPrimaryImage: 'اختر الصورة الرئيسية:',
      selectPrimaryImageHelp: 'انقر على زر الدائرة في أسفل يسار كل صورة (الصورة المحددة: {index})',
      selectPrimaryImageHelpDB: 'تم جلب الصور من قاعدة البيانات وقابلة للتعديل (الصورة الرئيسية: {index})',
      imageNumber: 'الصورة {index}',
      imagePreview: 'معاينة الصورة {index}',
      setPrimaryImage: 'تعيين كصورة رئيسية {selected}',
      selectImage: 'اختر صورة',
      imageUrlPlaceholder: 'رابط الصورة {index}',
      productCatalog: 'كتالوج المنتج (PDF)',
      catalogHelp: 'كتالوج أو كتيب المنتج بصيغة PDF للمعلومات الإضافية',
      catalogFile: 'ملف الكتالوج',
      selectCatalog: 'اختر الكتالوج',
      catalogName: 'اسم ملف الكتالوج',
      catalogNamePlaceholder: 'catalog.pdf',
      showToCustomers: 'عرض للعملاء',
      catalogURL: 'رابط الكتالوج',
      catalogURLPlaceholder: 'رابط الكتالوج',
      msds: 'MSDS',
      msdsHelp: 'ورقة بيانات سلامة المواد للمعلومات الأمنية',
      msdsFile: 'ملف MSDS',
      selectMSDS: 'اختر MSDS',
      msdsName: 'اسم ملف MSDS',
      msdsNamePlaceholder: 'msds.pdf',
      msdsURL: 'رابط MSDS',
      msdsURLPlaceholder: 'رابط MSDS',
      updateProduct: 'تحديث المنتج',
      addProduct: 'إضافة منتج',
      confirmDelete: 'تأكيد حذف المنتج',
      confirmDeleteDesc: 'هل أنت متأكد أنك تريد حذف المنتج "{name}"؟',
      confirmDeleteWarning: 'هذا الإجراء لا رجعة فيه وسيتم حذف المنتج من كل من الكتالوج والمتجر.',
      cancel: 'إلغاء',
      deleteProduct: 'حذف المنتج',
      activeBatch: 'الدفعة النشطة (قيد البيع):',
      fifoSystem: 'نظام FIFO - أقدم دفعة مع مخزون',
      totalStock: 'إجمالي المخزون: {stock}',
      onlyBatchesWithStock: 'فقط الدفعات مع المخزون',
      deleteBatch: 'حذف الدفعة',
      netWeightLabel: 'الوزن الصافي:',
      grossWeightLabel: 'الوزن الإجمالي:',
      weightLabel: 'الوزن:',
    },
    
    // Batch Management
    batchManagement: {
      pageTitle: 'إدارة الدفعات (FIFO)',
      pageSubtitle: 'إدارة دفعات المنتجات بنظام FIFO',
      searchBatches: 'البحث عن الدفعات',
      searchDescription: 'أدخل الباركود لعرض جميع الدفعات',
      barcodeLabel: 'باركود المنتج',
      barcodePlaceholder: 'مثال: 8649677123456',
      searchButton: 'بحث',
      currentSellingBatch: 'الدفعة النشطة للبيع (LIFO)',
      currentSellingDescription: 'هذه الدفعة مختارة حالياً للبيع',
      batchNumber: 'رقم الدفعة',
      stock: 'المخزون',
      stockUnits: 'وحدة',
      productionDate: 'تاريخ الإنتاج',
      activeStatus: 'نشط',
      totalBatches: 'عدد الدفعات',
      totalStock: 'إجمالي المخزون',
      barcode: 'الباركود',
      emptyBatches: 'الدفعات الفارغة',
      batchList: 'قائمة الدفعات (FIFO)',
      batchListDescription: 'تُباع الدفعات القديمة أولاً (First In, First Out)',
      soldOut: 'نفذت الكمية',
      selling: 'قيد البيع',
      waiting: 'في الانتظار',
      price: 'السعر',
      netWeight: 'الوزن الصافي',
      batchNotFound: 'لم يتم العثور على دفعة',
      noBatchesMessage: 'لا توجد دفعات مسجلة للباركود',
      loadingBatches: 'جاري تحميل معلومات الدفعات...',
    },
    
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
    rechargeAmount: 'مبلغ الشحن',
    bankReceipt: 'إيصال بنكي',
    rechargeHistory: 'تاريخ الشحن',
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
    requestRecharge: 'طلب شحن',
    
    // Wallet Management (Admin)
    walletHolders: 'حاملو المحفظة',
    walletManagement: 'إدارة المحفظة',
    changeAmount: 'تغيير المبلغ',
    reason: 'السبب',
    
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
    
    // Auth & Login
    auth: {
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      loggingIn: 'جاري تسجيل الدخول...',
      registering: 'جاري إنشاء الحساب...',
      welcome: 'أهلاً بك',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      loginError: 'خطأ في تسجيل الدخول',
      serverError: 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى',
      networkError: 'خطأ في الشبكة',
      networkErrorDesc: 'مشكلة في الاتصال. يرجى المحاولة مرة أخرى.',
      enterEmail: 'أدخل بريدك الإلكتروني',
      enterPassword: 'أدخل كلمة المرور',
      switchToLogin: 'التبديل إلى تسجيل الدخول',
      customerLogin: 'تسجيل دخول العميل',
      signInOrRegister: 'سجل الدخول إلى حسابك أو أنشئ حساباً جديداً',
      verifyMobileNumber: 'تحقق من رقم الهاتف المحمول',
      verificationCodeDescription: 'أدخل رمز التحقق المرسل إلى هاتفك المحمول',
      smsVerification: 'التحقق عبر الرسائل النصية',
      verificationCodeSent: 'تم إرسال رمز مكون من 4 أرقام إلى',
      codeSentTo: 'تم إرسال رمز إلى',
      enterVerificationCode: 'أدخل رمز التحقق',
      enterCodePlaceholder: 'أدخل الرمز المكون من 4 أرقام',
      enter4DigitCode: 'أدخل الرمز المكون من 4 أرقام',
      fourDigitCode: 'رمز مكون من 4 أرقام',
      sixDigitCode: 'رمز مكون من 6 أرقام',
      verifying: 'جاري التحقق...',
      verifyCode: 'تحقق من الرمز',
      verifyCodes: 'تحقق من الرموز',
      resend: 'إعادة الإرسال',
      back: 'رجوع',
      basicInformation: 'المعلومات الأساسية',
      contactInformation: 'معلومات الاتصال',
      addressInformation: 'معلومات العنوان',
      additionalInformation: 'معلومات إضافية',
      mobileNumber: 'رقم الهاتف المحمول',
      whatsappNumber: 'رقم الواتساب (إذا كان مختلفاً)',
      whatsappDefault: 'يتم استخدام رقم الهاتف المحمول افتراضياً',
      whatsappOptional: 'رقم الواتساب (اختياري)',
      leaveEmptyIfSame: 'اترك فارغاً إذا كان نفس رقم الهاتف المحمول',
      alternatePhone: 'هاتف بديل',
      province: 'المحافظة',
      selectProvince: 'اختر المحافظة',
      selectCity: 'اختر المدينة',
      selectCountry: 'اختر البلد',
      fullAddress: 'العنوان الكامل',
      secondaryAddress: 'العنوان الثانوي',
      postalCode: 'الرمز البريدي',
      industry: 'الصناعة',
      businessType: 'نوع العمل',
      companySize: 'حجم الشركة',
      manufacturer: 'مصنّع',
      distributor: 'موزع',
      retailer: 'تاجر تجزئة',
      endUser: 'مستخدم نهائي',
      small: 'صغيرة (1-50 موظف)',
      medium: 'متوسطة (51-250 موظف)',
      large: 'كبيرة (251-1000 موظف)',
      enterprise: 'مؤسسة (أكثر من 1000 موظف)',
      communicationPreference: 'تفضيلات التواصل',
      preferredLanguage: 'اللغة المفضلة',
      english: 'الإنجليزية',
      arabic: 'العربية',
      persian: 'الفارسية',
      marketingConsent: 'أوافق على تلقي الاتصالات التسويقية',
      requiredField: 'حقل مطلوب',
      verificationCodesSent: 'تم إرسال رموز التحقق',
      verificationCodesError: 'خطأ في إرسال رموز التحقق',
      registrationSuccessful: 'تم التسجيل بنجاح',
      accountCreated: 'تم إنشاء حسابك بنجاح',
      registrationError: 'خطأ في التسجيل',
      invalidCodes: 'رموز التحقق غير صالحة',
      verificationError: 'خطأ في التحقق من الرموز. يرجى المحاولة مرة أخرى',
      smsCodeLabel: 'رمز التحقق عبر الرسائل النصية',
      emailCodeLabel: 'رمز التحقق عبر البريد الإلكتروني',
      sentTo: 'تم الإرسال إلى',
      and: 'و',
      verify: 'تحقق',
      emailAlreadyRegistered: 'البريد الإلكتروني مسجل مسبقاً',
      emailAlreadyRegisteredDesc: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.',
      emailAlreadyRegisteredMessage: 'هذا البريد الإلكتروني مسجل مسبقاً',
      creatingAccount: 'جاري إنشاء الحساب...',
      createAccount: 'إنشاء حساب',
      dualVerification: 'التحقق المزدوج',
      verificationCodesSentTo: 'تم إرسال رموز التحقق إلى',
      profileUpdated: 'تم تحديث الملف الشخصي',
      profileUpdatedDesc: 'تم تحديث ملفك الشخصي بنجاح',
      updateError: 'خطأ في التحديث',
      updateFailed: 'فشل تحديث الملف الشخصي',
      registrationVerificationSent: 'تم التسجيل بنجاح',
      verificationSentDesc: 'تم إرسال رمز التحقق إلى رقم هاتفك المحمول',
      
      // Validation Messages
      validation: {
        invalidEmail: 'يرجى إدخال بريد إلكتروني صالح',
        passwordMin6: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
        firstNameMin2: 'يجب أن يتكون الاسم الأول من حرفين على الأقل',
        lastNameMin2: 'يجب أن يتكون اسم العائلة من حرفين على الأقل',
        phoneMin10: 'رقم الهاتف مطلوب',
        countryRequired: 'البلد مطلوب',
        provinceRequired: 'المحافظة مطلوبة',
        cityRequired: 'المدينة مطلوبة',
        addressMin5: 'العنوان مطلوب',
        passwordsMustMatch: 'يجب أن تتطابق كلمات المرور',
      },
    },
    
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
    paintThinner: 'مخفف الدهان',
    agriculturalFertilizers: 'الأسمدة الزراعية',
    paintSolvents: 'الدهان والمذيبات',
    industrialChemicals: 'المواد الكيميائية الصناعية',
    technicalEquipment: 'المعدات الفنية',
    commercialGoods: 'السلع التجارية',
    
    // Product category descriptions
    fuelAdditivesDesc: 'إضافات وقود عالية الأداء لتحسين كفاءة المحرك',
    waterTreatmentDesc: 'حلول شاملة لمعالجة المياه لجميع التطبيقات',
    paintSolventsDesc: 'تركيبات دهانات متميزة ومذيبات متخصصة',
    agriculturalFertilizersDesc: 'حلول أسمدة متقدمة للزراعة المستدامة',
    industrialChemicalsDesc: 'حلول كيميائية صناعية احترافية',
    paintThinnerDesc: 'مخففات دهان متخصصة ومنتجات ذات صلة',
    technicalEquipmentDesc: 'معدات وأدوات فنية احترافية',
    commercialGoodsDesc: 'السلع التجارية وحلول الأعمال',
    
    // Product Reviews
    productReviews: 'مراجعات المنتج',
    customerReviews: 'آراء العملاء',
    addYourReview: 'أضف مراجعتك',
    writeReview: 'اكتب مراجعة',
    rating: 'التقييم',
    comment: 'التعليق',
    customerName: 'اسم العميل',
    submitReview: 'إرسال المراجعة',
    reviewSubmitted: 'تم تقديم المراجعة',
    reviewSubmittedDesc: 'تم تقديم مراجعتك بنجاح',
    reviewError: 'خطأ في تقديم المراجعة',
    reviewErrorDesc: 'خطأ',
    loadingReviews: 'جاري تحميل المراجعات...',
    customerReviewTitle: 'رأي العميل حول',
    backToShop: 'العودة للمتجر',
    averageRating: 'متوسط التقييم',
    totalReviews: 'إجمالي المراجعات',
    noReviewsYet: 'لا توجد مراجعات بعد',
    noReviewsDesc: 'كن أول من يراجع هذا المنتج',
    productSpecifications: 'المواصفات',
    reviewsAndRatings: 'المراجعات والتقييمات',
    customerFeedback: 'ملاحظات العملاء',
    productReviewsFor: 'آراء المنتج:',
    totalReviewsCount: 'إجمالي الآراء',
    loginToReview: 'سجل دخولك لإضافة رأيك',
    loginToReviewDesc: 'لإضافة رأيك وتقييم المنتجات، يرجى تسجيل الدخول إلى حسابك أولاً',
    reviewingAs: 'المراجعة باسم:',
    yourPreviousReview: 'رأيك السابق:',
    editReview: 'تعديل الرأي',
    postedOn: 'نُشر في:',
    editYourReview: 'عدّل رأيك...',
    updateReview: 'تحديث الرأي',
    beFirstToReview: 'كن أول من يقيّم',
    you: '(أنت)',
    reviewUpdated: 'تم تحديث الرأي بنجاح',
    reviewUpdatedDesc: 'تم حفظ تغييراتك',
    review: 'رأي',
    reviews: 'آراء',
    
    // Contact Page
    contactPage: {
      // Form Labels
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      emailAddress: 'البريد الإلكتروني',
      company: 'الشركة',
      productInterest: 'الاهتمام بالمنتج',
      message: 'الرسالة',
      
      // Form Placeholders
      firstNamePlaceholder: 'أحمد',
      lastNamePlaceholder: 'علي',
      emailPlaceholder: 'ahmed@company.com',
      companyPlaceholder: 'شركتك',
      productInterestPlaceholder: 'اختر فئة المنتج',
      messagePlaceholder: 'أخبرنا عن متطلباتك...',
      
      // Product Categories
      waterTreatment: 'معالجة المياه',
      fuelAdditives: 'إضافات الوقود',
      paintThinner: 'الدهان والمذيبات',
      agriculturalFertilizers: 'الأسمدة الزراعية',
      industrialChemicals: 'المواد الكيميائية الصناعية',
      technicalEquipment: 'المعدات الفنية',
      commercialGoods: 'السلع التجارية',
      customSolutions: 'حلول مخصصة',
      
      // Buttons
      sending: 'جاري الإرسال...',
      sendMessage: 'إرسال الرسالة',
      
      // Toast Messages
      messageSent: 'تم إرسال الرسالة بنجاح',
      messageSentDesc: 'شكراً لاستفساركم. سنعود إليكم خلال 24 ساعة.',
      errorTitle: 'خطأ',
      errorDesc: 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.',
      
      // Sections
      contactInformation: 'معلومات الاتصال',
      ourCertifications: 'شهاداتنا',
      findUs: 'ابحث عنا',
      visitHeadquarters: 'قم بزيارة مقرنا الرئيسي ومنشآتنا التصنيعية',
      getDirections: 'احصل على الاتجاهات',
      viewInMaps: 'عرض في خرائط Google',
    },
    
    // Footer
    aboutCompany: 'حول الشركة',
    contactInfo: 'معلومات الاتصال',
    followUs: 'تابعونا',
    allRightsReserved: 'جميع الحقوق محفوظة',
    
    // Home Page - Hero Section
    advancedChemical: 'حلول كيميائية',
    solutions: 'متقدمة',
    forIndustry: 'للصناعة',
    heroDescription: 'الشركة الرائدة في تصنيع إضافات الوقود المتميزة، وأنظمة معالجة المياه، ومنتجات الدهانات والمذيبات، والأسمدة الزراعية للصناعات العالمية.',
    exploreProducts: 'استكشف المنتجات',
    contactSales: 'اتصل بالمبيعات',
    
    // Home Page - Products
    ourProductPortfolio: 'مجموعة منتجاتنا',
    productPortfolioDesc: 'حلول كيميائية شاملة عبر أربعة صناعات رئيسية، مصممة للأداء والموثوقية.',
    products_plural: 'منتجات',
    availableProducts: 'المنتجات المتوفرة:',
    moreProducts: 'المزيد من المنتجات',
    viewAll: 'عرض الكل',
    aboutMomtazchem: 'حول ممتاز كيم',
    aboutMomtazchemDesc1: 'مع أكثر من 25 عامًا من التميز في تصنيع المواد الكيميائية، أثبتت ممتاز كيم نفسها كشريك موثوق للصناعات في جميع أنحاء العالم. التزامنا بالابتكار والجودة والاستدامة يدفع كل ما نقوم به.',
    aboutMomtazchemDesc2: 'من منشآتنا الحديثة، نطور وننتج حلولًا كيميائية عالية الجودة تلبي الاحتياجات المتطورة للوقود ومعالجة المياه والدهانات والصناعات الزراعية.',
    learnMoreAboutUs: 'تعرف على المزيد عنا',
    customerSatisfaction: 'رضا العملاء',
    ourServicesCapabilities: 'خدماتنا وقدراتنا',
    servicesCapabilitiesDesc: 'دعم شامل من البحث والتطوير إلى التسليم والمساعدة الفنية.',
    rdServices: 'خدمات البحث والتطوير',
    rdServicesDesc: 'تطوير تركيبات مخصصة وتحسين المنتجات لتلبية متطلبات الصناعة المحددة.',
    customFormulations: 'تركيبات مخصصة',
    productTesting: 'اختبار المنتج',
    performanceAnalysis: 'تحليل الأداء',
    globalDistribution: 'التوزيع العالمي',
    globalDistributionDesc: 'سلسلة توريد ولوجستيات موثوقة تضمن التسليم في الوقت المناسب في جميع أنحاء العالم.',
    countries40Plus: '40+ دولة',
    expressShipping: 'شحن سريع',
    bulkOrders: 'طلبات بالجملة',
    technicalSupport: 'الدعم الفني',
    technicalSupportDesc: 'مساعدة فنية خبيرة واستشارات لتطبيق المنتج الأمثل والأداء.',
    support24_7: 'دعم 24/7',
    applicationTraining: 'تدريب التطبيق',
    documentation: 'التوثيق',
    
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
    sustainability: 'الاستدامة',
    sustainabilityDesc: 'ملتزمون بالممارسات المستدامة والحلول المسؤولة بيئياً',
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
    
    // Certifications
    iso9001: 'ISO 9001:2015',
    iso9001Desc: 'أنظمة إدارة الجودة',
    iso14001: 'ISO 14001',
    iso14001Desc: 'الإدارة البيئية',
    ohsas18001: 'OHSAS 18001',
    ohsas18001Desc: 'الصحة والسلامة المهنية',
    reachCompliance: 'الامتثال لـ REACH',
    reachComplianceDesc: 'لائحة المواد الكيميائية الأوروبية',
    
    // Product Form
    productManagement: 'إدارة المنتجات',
    addProduct: 'إضافة منتج',
    editProduct: 'تحرير منتج',
    productName: 'اسم المنتج',
    shortDescription: 'وصف مختصر',
    productDescription: 'وصف المنتج',
    priceRange: 'نطاق السعر',
    productCategory: 'فئة المنتج',
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
    
    // Services Page
    servicesPage: {
      title: 'خدماتنا وقدراتنا',
      subtitle: 'دعم شامل من البحث والتطوير إلى التسليم والمساعدة الفنية، لضمان نجاحك في كل خطوة على الطريق.',
      
      rdTitle: 'البحث والتطوير',
      rdDesc: 'تطوير تركيبات مخصصة وتحسين المنتجات لتلبية متطلباتك المحددة.',
      rdFeature1: 'تركيبات كيميائية مخصصة',
      rdFeature2: 'اختبار أداء المنتج',
      rdFeature3: 'دعم الامتثال التنظيمي',
      rdFeature4: 'التوسع من المختبر إلى الإنتاج',
      rdFeature5: 'تحسين الجودة',
      rdFeature6: 'تطوير التطبيقات',
      
      distributionTitle: 'التوزيع العالمي',
      distributionDesc: 'سلسلة توريد وشبكة لوجستية موثوقة تضمن التسليم في الوقت المحدد في جميع أنحاء العالم.',
      distFeature1: 'تغطية أكثر من 40 دولة',
      distFeature2: 'خيارات الشحن السريع',
      distFeature3: 'معالجة الطلبات بالجملة',
      distFeature4: 'إدارة السلسلة الباردة',
      distFeature5: 'التتبع الفوري',
      distFeature6: 'التخزين المحلي',
      
      techSupportTitle: 'الدعم الفني',
      techSupportDesc: 'مساعدة فنية واستشارات من الخبراء للتطبيق الأمثل للمنتج.',
      techFeature1: 'خط مساعدة فني على مدار الساعة',
      techFeature2: 'تدريب على التطبيقات',
      techFeature3: 'دعم استكشاف الأخطاء وإصلاحها',
      techFeature4: 'تحسين الأداء',
      techFeature5: 'إرشادات السلامة',
      techFeature6: 'دعم التوثيق',
      
      consultingTitle: 'خدمات الاستشارات',
      consultingDesc: 'استشارات استراتيجية للمساعدة في تحسين عملياتك ومنتجاتك الكيميائية.',
      consultFeature1: 'تحسين العمليات',
      consultFeature2: 'تحليل خفض التكاليف',
      consultFeature3: 'تقييم الاستدامة',
      consultFeature4: 'إرشادات تنظيمية',
      consultFeature5: 'تحليل السوق',
      consultFeature6: 'التخطيط الاستراتيجي',
      
      qaTitle: 'ضمان الجودة',
      qaDesc: 'برامج شاملة لمراقبة الجودة وضمانها لجميع منتجاتنا.',
      qaFeature1: 'عمليات معتمدة من ISO',
      qaFeature2: 'اختبار وتحليل الدفعات',
      qaFeature3: 'شهادة التحليل',
      qaFeature4: 'توثيق الجودة',
      qaFeature5: 'الامتثال التنظيمي',
      qaFeature6: 'المراقبة المستمرة',
      
      customMfgTitle: 'التصنيع المخصص',
      customMfgDesc: 'حلول تصنيع مخصصة للمتطلبات الكيميائية المتخصصة.',
      customFeature1: 'التصنيع بموجب العقد',
      customFeature2: 'العلامات التجارية الخاصة',
      customFeature3: 'أحجام دفعات مرنة',
      customFeature4: 'تركيبات متخصصة',
      customFeature5: 'حلول التعبئة والتغليف',
      customFeature6: 'تكامل سلسلة التوريد',
      
      coreCapabilities: 'قدراتنا الأساسية',
      coreCapabilitiesDesc: 'مدعومة بعقود من الخبرة والتكنولوجيا المتطورة',
      advManufacturing: 'التصنيع المتقدم',
      advManufacturingDesc: 'منشآت حديثة مع معدات وأتمتة عصرية',
      qualityControl: 'مراقبة الجودة',
      qualityControlDesc: 'اختبارات صارمة وضمان الجودة في كل مرحلة',
      globalReachCap: 'الوصول العالمي',
      globalReachCapDesc: 'خدمة العملاء في أكثر من 40 دولة حول العالم',
      expertTeam: 'فريق الخبراء',
      expertTeamDesc: 'أكثر من 50 عالم بحث وتطوير وخبير هندسة كيميائية',
      
      serviceProcess: 'عملية الخدمة لدينا',
      serviceProcessDesc: 'من الاستشارة الأولية إلى الدعم المستمر، نحن معك في كل خطوة',
      consultation: 'الاستشارة',
      consultationDesc: 'فهم متطلباتك وتحدياتك المحددة',
      development: 'التطوير',
      developmentDesc: 'تطوير التركيبات والحلول المخصصة',
      testing: 'الاختبار',
      testingDesc: 'اختبار صارم والتحقق من الجودة',
      delivery: 'التسليم',
      deliveryDesc: 'الإنتاج والتسليم والدعم المستمر',
      
      readyToStart: 'هل أنت مستعد للبدء؟',
      contactExpertsDesc: 'اتصل بفريق الخبراء لدينا لمناقشة احتياجاتك من الحلول الكيميائية واكتشف كيف يمكننا مساعدة عملك على النجاح.',
      contactSales: 'اتصل بفريق المبيعات',
      requestQuote: 'طلب عرض أسعار',
      
      contactSalesTitle: 'اتصل بفريق المبيعات',
      fullName: 'الاسم الكامل',
      emailAddress: 'عنوان البريد الإلكتروني',
      companyName: 'الشركة',
      phoneNumber: 'رقم الهاتف',
      message: 'الرسالة',
      messagePlaceholder: 'أخبرنا عن متطلباتك...',
      cancel: 'إلغاء',
      sendMessage: 'إرسال الرسالة',
      sending: 'جاري الإرسال...',
      
      requestQuoteTitle: 'طلب عرض أسعار',
      productCategory: 'فئة المنتج',
      productCategoryPlaceholder: 'مثل: الأسمدة الزراعية، معالجة المياه، إلخ.',
      requiredQuantity: 'الكمية المطلوبة',
      quantityPlaceholder: 'مثل: 500 كجم، 10 أطنان',
      requiredTimeline: 'الجدول الزمني المطلوب',
      timelinePlaceholder: 'مثل: في غضون أسبوعين',
      productSpecs: 'مواصفات المنتج',
      specsPlaceholder: 'يرجى تقديم مواصفات مفصلة، متطلبات النقاء، تفضيلات التعبئة، إلخ.',
      additionalReqs: 'المتطلبات الإضافية',
      additionalPlaceholder: 'أي معلومات إضافية أو متطلبات خاصة...',
      submitQuote: 'تقديم طلب عرض الأسعار',
      submitting: 'جاري التقديم...',
      
      messageSent: 'تم إرسال الرسالة بنجاح',
      messageSentDesc: 'سيتصل بك فريق المبيعات لدينا خلال 24 ساعة.',
      quoteSubmitted: 'تم تقديم طلب عرض الأسعار',
      quoteSubmittedDesc: 'سيقوم فريقنا بإعداد عرض الأسعار والرد خلال 24 ساعة.',
      errorTitle: 'خطأ',
      messageFailed: 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.',
      quoteFailed: 'فشل تقديم طلب عرض الأسعار. يرجى المحاولة مرة أخرى.',
    },
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
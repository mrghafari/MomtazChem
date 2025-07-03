// Centralized Barcode Generation Utilities
// This ensures consistent EAN-13 generation across the entire application

// EAN-13 Check Digit Calculation
export const calculateEAN13CheckDigit = (barcode12: string): string => {
  let oddSum = 0;
  let evenSum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    if (i % 2 === 0) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }
  
  const total = oddSum + (evenSum * 3);
  const checkDigit = (10 - (total % 10)) % 10;
  return checkDigit.toString();
};

// Generate consistent product identifier based on product name hash
export const generateProductHash = (productName: string): string => {
  let hash = 0;
  const cleanName = productName.toLowerCase().trim();
  
  for (let i = 0; i < cleanName.length; i++) {
    const char = cleanName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and get 2 digits
  const positiveHash = Math.abs(hash);
  return (positiveHash % 100).toString().padStart(2, '0');
};

// Get category code for EAN-13
export const getCategoryCode = (category: string): string => {
  switch (category) {
    case 'water-treatment': return '100';
    case 'fuel-additives': return '200';
    case 'paint-thinner': return '300';
    case 'agricultural-fertilizers': return '400';
    case 'other-products': return '500';
    default: return '000';
  }
};

// Main EAN-13 Generation Function
export const generateEAN13Barcode = (productName: string, category: string): string => {
  // Iraq GS1 country code
  const countryCode = '864';
  
  // Momtazchem company prefix (registered with GS1 Iraq)
  const companyPrefix = '0001';
  
  // Get category code
  const categoryCode = getCategoryCode(category);
  
  // Generate consistent product identifier
  const productId = generateProductHash(productName);
  
  // Build 12-digit code
  const barcode12 = countryCode + companyPrefix + categoryCode + productId;
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(barcode12);
  const fullBarcode = barcode12 + checkDigit;
  
  // Debug log
  console.log('Barcode generation details:', {
    productName,
    category,
    countryCode,
    companyPrefix,
    categoryCode,
    productId,
    barcode12,
    checkDigit,
    fullBarcode,
    isValid: validateEAN13(fullBarcode)
  });
  
  return fullBarcode;
};

// Validate EAN-13 barcode
export const validateEAN13 = (barcode: string): boolean => {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  const barcode12 = barcode.substring(0, 12);
  const providedCheckDigit = barcode.substring(12, 13);
  const calculatedCheckDigit = calculateEAN13CheckDigit(barcode12);
  
  return providedCheckDigit === calculatedCheckDigit;
};

// Extract information from EAN-13 barcode
export const parseEAN13Barcode = (barcode: string): {
  countryCode: string;
  companyPrefix: string;
  categoryCode: string;
  productId: string;
  checkDigit: string;
  isValid: boolean;
  category?: string;
} => {
  if (!validateEAN13(barcode)) {
    return {
      countryCode: '',
      companyPrefix: '',
      categoryCode: '',
      productId: '',
      checkDigit: '',
      isValid: false
    };
  }
  
  const countryCode = barcode.substring(0, 3);
  const companyPrefix = barcode.substring(3, 7);
  const categoryCode = barcode.substring(7, 10);
  const productId = barcode.substring(10, 12);
  const checkDigit = barcode.substring(12, 13);
  
  // Reverse lookup category
  let category: string | undefined;
  switch (categoryCode) {
    case '100': category = 'water-treatment'; break;
    case '200': category = 'fuel-additives'; break;
    case '300': category = 'paint-thinner'; break;
    case '400': category = 'agricultural-fertilizers'; break;
    case '500': category = 'other-products'; break;
  }
  
  return {
    countryCode,
    companyPrefix,
    categoryCode,
    productId,
    checkDigit,
    isValid: true,
    category
  };
};

// Check if barcode belongs to our company
export const isMomtazchemBarcode = (barcode: string): boolean => {
  if (!validateEAN13(barcode)) return false;
  
  const parsed = parseEAN13Barcode(barcode);
  return parsed.countryCode === '864' && parsed.companyPrefix === '0001';
};
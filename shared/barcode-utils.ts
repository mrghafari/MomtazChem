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

// Check if barcode is unique across all products
export const checkBarcodeUniqueness = async (barcode: string, excludeProductId?: number): Promise<{isUnique: boolean, duplicateProduct?: any}> => {
  try {
    const url = `/api/barcode/check-duplicate/${barcode}${excludeProductId ? `?excludeProductId=${excludeProductId}` : ''}`;
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        isUnique: result.data.isUnique,
        duplicateProduct: result.data.duplicateProduct
      };
    } else {
      console.error('Failed to check barcode uniqueness');
      return { isUnique: true }; // Default to allowing if check fails
    }
  } catch (error) {
    console.error('Error checking barcode uniqueness:', error);
    return { isUnique: true }; // Default to allowing if check fails
  }
};

// Generate unique EAN-13 barcode for a product with duplicate checking
export const generateUniqueEAN13Barcode = async (productName: string, category: string, excludeProductId?: number): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const barcode = generateEAN13BarcodeWithIncrement(productName, category, attempts);
    const uniquenessCheck = await checkBarcodeUniqueness(barcode, excludeProductId);
    
    if (uniquenessCheck.isUnique) {
      return barcode;
    }
    
    attempts++;
  }
  
  // If all attempts failed, generate with timestamp suffix
  const timestamp = Date.now().toString().slice(-3);
  return await generateEAN13Barcode(productName + timestamp, category);
};

// Generate random 5-digit product code that is unique
const generateUniqueProductCode = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate random 5-digit code
    const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Check if this code is already used
    const uniquenessCheck = await checkProductCodeUniqueness(randomCode);
    if (uniquenessCheck.isUnique) {
      return randomCode;
    }
    attempts++;
  }
  
  // If all random attempts failed, use timestamp-based code
  const timestamp = Date.now().toString().slice(-5);
  return timestamp;
};

// Check if product code is unique across all products
const checkProductCodeUniqueness = async (productCode: string): Promise<{isUnique: boolean}> => {
  try {
    const url = `/api/barcode/check-product-code/${productCode}`;
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      return { isUnique: result.data.isUnique };
    } else {
      return { isUnique: true }; // Default to allowing if check fails
    }
  } catch (error) {
    console.error('Error checking product code uniqueness:', error);
    return { isUnique: true }; // Default to allowing if check fails
  }
};

// Generate EAN-13 barcode with new format: 846-96771-XXXXX-C
export const generateEAN13BarcodeWithIncrement = async (productName: string, category: string, increment: number = 0): Promise<string> => {
  // Iraq GS1 country code
  const countryCode = '846';
  
  // Momtazchem company code
  const companyCode = '96771';
  
  // Generate unique 5-digit product code
  const productCode = await generateUniqueProductCode();
  
  // Build 12-digit code: 846 + 96771 + XXXXX
  const barcode12 = countryCode + companyCode + productCode;
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(barcode12);
  const fullBarcode = barcode12 + checkDigit;
  
  return fullBarcode;
};

// Main EAN-13 Generation Function - Updated Format
export const generateEAN13Barcode = async (productName: string, category: string): Promise<string> => {
  // Iraq GS1 country code
  const countryCode = '846';
  
  // Momtazchem company code
  const companyCode = '96771';
  
  // Generate unique 5-digit product code
  const productCode = await generateUniqueProductCode();
  
  // Build 12-digit code: 846 + 96771 + XXXXX
  const barcode12 = countryCode + companyCode + productCode;
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(barcode12);
  const fullBarcode = barcode12 + checkDigit;
  
  // Debug log
  console.log('New barcode generation details:', {
    productName,
    category,
    countryCode,
    companyCode,
    productCode,
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
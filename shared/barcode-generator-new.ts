// New Barcode Generation System with Iraq Country Code 864
// Format: 864-96771-XXXXX-C (Iraq + Momtazchem + Product Code + Check Digit)

// EAN-13 Check Digit Calculation
export const calculateEAN13CheckDigit = (barcode12: string): string => {
  if (typeof barcode12 !== 'string' || barcode12.length !== 12) {
    console.error('Invalid barcode12 for check digit calculation:', barcode12);
    return '0';
  }
  
  let oddSum = 0;
  let evenSum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    if (isNaN(digit)) {
      console.error('Invalid digit in barcode12:', barcode12[i], 'at position', i);
      return '0';
    }
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

// Generate unique 5-digit product code synchronously
export const generateUniqueProductCode = (): string => {
  // Generate random 5-digit code between 10000-99999
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Main EAN-13 barcode generation function
export const generateEAN13Barcode = (productName: string, category: string): string => {
  // Iraq GS1 country code (correct)
  const countryCode = '864';
  
  // Momtazchem company code
  const companyCode = '96771';
  
  // Generate unique 5-digit product code
  const productCode = generateUniqueProductCode();
  
  // Build 12-digit code: 864 + 96771 + XXXXX
  const barcode12 = countryCode + companyCode + productCode;
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(barcode12);
  const fullBarcode = barcode12 + checkDigit;
  
  // Debug log
  console.log('New EAN-13 barcode generation:', {
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

// Parse EAN-13 barcode into components
export const parseEAN13Barcode = (barcode: string): {
  countryCode: string;
  companyCode: string;
  productCode: string;
  checkDigit: string;
  isValid: boolean;
} => {
  if (!validateEAN13(barcode)) {
    return {
      countryCode: '',
      companyCode: '',
      productCode: '',
      checkDigit: '',
      isValid: false
    };
  }
  
  const countryCode = barcode.substring(0, 3);   // 864
  const companyCode = barcode.substring(3, 8);   // 96771
  const productCode = barcode.substring(8, 13);  // XXXXX
  const checkDigit = barcode.substring(12, 13);  // C
  
  return {
    countryCode,
    companyCode,
    productCode,
    checkDigit,
    isValid: true
  };
};

// Check if barcode belongs to Momtazchem
export const isMomtazchemBarcode = (barcode: string): boolean => {
  if (!validateEAN13(barcode)) return false;
  
  const parsed = parseEAN13Barcode(barcode);
  return parsed.countryCode === '864' && parsed.companyCode === '96771';
};

// Format barcode for display (864-96771-XXXXX-C)
export const formatBarcodeForDisplay = (barcode: string): string => {
  if (!validateEAN13(barcode)) return barcode;
  
  const parsed = parseEAN13Barcode(barcode);
  return `${parsed.countryCode}-${parsed.companyCode}-${parsed.productCode.substring(0, 5)}-${parsed.checkDigit}`;
};
/**
 * Frontend currency utilities for Iraqi Dinar (IQD) handling
 * All IQD amounts should be whole numbers without decimals
 */

export interface CurrencyConfig {
  currency: string;
  hasDecimals: boolean;
  decimalPlaces: number;
  symbol: string;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  'IQD': {
    currency: 'IQD',
    hasDecimals: false,
    decimalPlaces: 0,
    symbol: 'IQD'
  },
  'USD': {
    currency: 'USD',
    hasDecimals: true,
    decimalPlaces: 2,
    symbol: '$'
  },
  'EUR': {
    currency: 'EUR',
    hasDecimals: true,
    decimalPlaces: 2,
    symbol: '€'
  }
};

/**
 * Format amount for Iraqi Dinar - always whole numbers
 */
export function formatIQDAmount(amount: number | string): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(numAmount);
}

/**
 * Format currency amount based on currency type
 */
export function formatCurrencyAmount(amount: number | string, currency: string = 'IQD'): number {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['IQD'];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (!config.hasDecimals) {
    return Math.round(numAmount);
  }
  
  return Math.round(numAmount * Math.pow(10, config.decimalPlaces)) / Math.pow(10, config.decimalPlaces);
}

/**
 * Display currency amount as string (for UI display)
 */
export function displayCurrencyAmount(amount: number | string, currency: string = 'IQD'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['IQD'];
  const formattedAmount = formatCurrencyAmount(amount, currency);
  
  if (!config.hasDecimals) {
    // For IQD: no decimals, no .00
    return formattedAmount.toString();
  }
  
  return formattedAmount.toFixed(config.decimalPlaces);
}

/**
 * Display currency amount with symbol for UI
 */
export function displayCurrencyAmountWithSymbol(amount: number | string, currency: string = 'IQD'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['IQD'];
  const displayAmount = displayCurrencyAmount(amount, currency);
  
  if (currency === 'IQD') {
    return `${displayAmount} ${config.symbol}`;
  } else {
    return `${config.symbol}${displayAmount}`;
  }
}

/**
 * Parse user input to proper currency amount
 */
export function parseCurrencyInput(input: string | number, currency: string = 'IQD'): number {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['IQD'];
  
  if (typeof input === 'number') {
    return formatCurrencyAmount(input, currency);
  }
  
  // Remove common formatting characters
  const cleanInput = input.replace(/[,\s]/g, '');
  const numValue = parseFloat(cleanInput);
  
  if (isNaN(numValue)) {
    return 0;
  }
  
  return formatCurrencyAmount(numValue, currency);
}

/**
 * Check if two currency amounts are equal (considering rounding for IQD)
 */
export function currencyAmountsEqual(amount1: number | string, amount2: number | string, currency: string = 'IQD'): boolean {
  const formatted1 = formatCurrencyAmount(amount1, currency);
  const formatted2 = formatCurrencyAmount(amount2, currency);
  return formatted1 === formatted2;
}

/**
 * Add currency amounts properly
 */
export function addCurrencyAmounts(amount1: number | string, amount2: number | string, currency: string = 'IQD'): number {
  const formatted1 = formatCurrencyAmount(amount1, currency);
  const formatted2 = formatCurrencyAmount(amount2, currency);
  return formatCurrencyAmount(formatted1 + formatted2, currency);
}

/**
 * Subtract currency amounts properly
 */
export function subtractCurrencyAmounts(amount1: number | string, amount2: number | string, currency: string = 'IQD'): number {
  const formatted1 = formatCurrencyAmount(amount1, currency);
  const formatted2 = formatCurrencyAmount(amount2, currency);
  return formatCurrencyAmount(Math.max(0, formatted1 - formatted2), currency);
}

/**
 * Format number input for currency display (remove decimal places for IQD)
 */
export function formatNumberInput(value: string, currency: string = 'IQD'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['IQD'];
  
  if (!config.hasDecimals) {
    // For IQD: remove decimal point and everything after it
    return value.replace(/\.[0-9]*/, '');
  }
  
  return value;
}
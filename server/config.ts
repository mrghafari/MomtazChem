/**
 * Configuration for domain and environment settings
 */

export const CONFIG = {
  // Domain configuration
  PRODUCTION_DOMAIN: 'https://www.momtazchem.com',
  DEVELOPMENT_DOMAIN: 'https://861926f6-85c5-4e93-bb9b-7e1a3d8bd878-00-2majci4octycm.picard.replit.dev',
  
  // Get the appropriate base URL based on environment
  getBaseUrl: (req?: any): string => {
    // Priority order:
    // 1. Environment variable FRONTEND_URL (for production deployment)
    // 2. Request headers (for current development session)
    // 3. Production domain if NODE_ENV is production
    // 4. Development domain as fallback
    
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }
    
    if (req && req.get('host')) {
      return `${req.protocol}://${req.get('host')}`;
    }
    
    if (process.env.NODE_ENV === 'production') {
      return CONFIG.PRODUCTION_DOMAIN;
    }
    
    return CONFIG.DEVELOPMENT_DOMAIN;
  },
  
  // Generate password reset URL (admin users)
  getPasswordResetUrl: (token: string, req?: any): string => {
    const baseUrl = CONFIG.getBaseUrl(req);
    return `${baseUrl}/reset-password/${token}`;
  },
  
  // Generate customer password reset URL
  getCustomerPasswordResetUrl: (token: string, req?: any): string => {
    const baseUrl = CONFIG.getBaseUrl(req);
    return `${baseUrl}/customer-reset-password?token=${token}`;
  },
  
  // Generate login URL
  getLoginUrl: (req?: any): string => {
    const baseUrl = CONFIG.getBaseUrl(req);
    return `${baseUrl}/login`;
  }
};
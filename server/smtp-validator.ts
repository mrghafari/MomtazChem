import nodemailer from 'nodemailer';

// Email provider configurations
export interface EmailProvider {
  name: string;
  domains: string[];
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    requiresAuth: boolean;
    supportsTLS: boolean;
  };
  instructions: string[];
  appPasswordRequired: boolean;
}

export const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    name: 'Zoho Mail',
    domains: ['zoho.com', 'zohomail.com'],
    smtp: {
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      supportsTLS: true,
    },
    instructions: [
      'Enable Two-Factor Authentication in your Zoho account',
      'Go to Account Settings → Security → App Passwords',
      'Generate a new App Password for "Website Email Service"',
      'Use the generated App Password instead of your regular password',
    ],
    appPasswordRequired: true,
  },
  {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      supportsTLS: true,
    },
    instructions: [
      'Enable 2-Step Verification in your Google account',
      'Go to Google Account settings → Security → App passwords',
      'Generate an App Password for "Mail"',
      'Use the 16-character App Password for authentication',
    ],
    appPasswordRequired: true,
  },
  {
    name: 'Outlook/Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      supportsTLS: true,
    },
    instructions: [
      'Enable two-step verification in your Microsoft account',
      'Go to Security settings → Advanced security options',
      'Create an App Password for email applications',
      'Use the App Password for SMTP authentication',
    ],
    appPasswordRequired: true,
  },
  {
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com'],
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      supportsTLS: true,
    },
    instructions: [
      'Enable two-step verification in Yahoo account security',
      'Go to Account Security → Generate app password',
      'Select "Other app" and enter "Website Email"',
      'Use the generated password for SMTP authentication',
    ],
    appPasswordRequired: true,
  },
];

export interface ValidationResult {
  isValid: boolean;
  provider?: EmailProvider;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  configurationStatus: {
    hostReachable: boolean;
    portOpen: boolean;
    tlsSupported: boolean;
    authenticationWorking: boolean;
  };
}

export class SMTPValidator {
  /**
   * Auto-detect email provider from email address
   */
  static detectProvider(email: string): EmailProvider | null {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    return EMAIL_PROVIDERS.find(provider => 
      provider.domains.some(providerDomain => 
        domain === providerDomain || domain.endsWith('.' + providerDomain)
      )
    ) || null;
  }

  /**
   * Validate SMTP configuration with comprehensive testing
   */
  static async validateConfiguration(
    email: string, 
    password: string, 
    customHost?: string, 
    customPort?: number
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: [],
      configurationStatus: {
        hostReachable: false,
        portOpen: false,
        tlsSupported: false,
        authenticationWorking: false,
      },
    };

    try {
      // Test 1: Basic input validation
      if (!email || !email.includes('@') || !email.includes('.')) {
        result.errors.push('Invalid email address format');
        return result;
      }

      if (!password || password.length < 3) {
        result.errors.push('Password is required and must be at least 3 characters');
        return result;
      }

      // Detect provider
      const provider = this.detectProvider(email);
      if (provider) {
        result.provider = provider;
      }

      // Use detected provider settings or custom settings
      const host = customHost || provider?.smtp.host || 'smtp.gmail.com';
      const port = customPort || provider?.smtp.port || 587;

      // Test 2: Basic connection test
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user: email,
            pass: password,
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000,
        });

        // Test connection with strict verification
        await transporter.verify();
        
        // Additional verification: test if we can actually authenticate
        const testConnection = await new Promise((resolve, reject) => {
          const transport = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user: email,
              pass: password,
            },
            connectionTimeout: 5000,
            greetingTimeout: 3000,
          });

          transport.verify((error, success) => {
            transport.close();
            if (error) {
              reject(error);
            } else {
              resolve(success);
            }
          });
        });

        if (testConnection) {
          result.configurationStatus.hostReachable = true;
          result.configurationStatus.portOpen = true;
          result.configurationStatus.tlsSupported = true;
          result.configurationStatus.authenticationWorking = true;
          result.isValid = true;
        } else {
          result.errors.push('SMTP verification failed - authentication unsuccessful');
        }

      } catch (error: any) {
        // Log detailed error for debugging
        console.error('SMTP Validation Error:', {
          code: error.code,
          message: error.message,
          command: error.command,
          response: error.response,
          email: email.split('@')[1], // Only domain for privacy
        });

        // Mark all status as failed
        result.configurationStatus.hostReachable = false;
        result.configurationStatus.portOpen = false;
        result.configurationStatus.tlsSupported = false;
        result.configurationStatus.authenticationWorking = false;

        // Analyze specific error types with more details
        if (error.code === 'EAUTH' || error.responseCode === 535) {
          result.errors.push('Authentication failed - Invalid credentials or app password required');
          if (provider?.appPasswordRequired) {
            result.suggestions.push(`${provider.name} requires an App Password instead of your regular password`);
            result.suggestions.push(...provider.instructions);
          } else {
            result.suggestions.push('Verify your email address and password are correct');
            result.suggestions.push('Many providers require app-specific passwords for third-party applications');
          }
        } else if (error.code === 'ECONNECTION' || error.code === 'ENOTFOUND') {
          result.errors.push('Connection failed - Cannot reach SMTP server');
          result.suggestions.push('Check your host and port settings');
          result.suggestions.push('Verify your internet connection and firewall settings');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
          result.errors.push('Connection timeout - SMTP server is unreachable');
          result.suggestions.push('Try a different port (465 for SSL, 587 for TLS)');
          result.suggestions.push('Check if your network blocks SMTP connections');
        } else if (error.responseCode === 550) {
          result.errors.push('SMTP server rejected the request');
          result.suggestions.push('Email provider may have additional security requirements');
        } else {
          result.errors.push(`SMTP Configuration Error: ${error.message || 'Unknown error'}`);
          if (error.responseCode) {
            result.errors.push(`Server Response Code: ${error.responseCode}`);
          }
        }
      }

      // Test 2: Alternative port testing if primary failed
      if (!result.isValid && provider) {
        const alternativePorts = [587, 465, 25];
        for (const testPort of alternativePorts) {
          if (testPort === port) continue; // Skip already tested port

          try {
            const transporter = nodemailer.createTransport({
              host,
              port: testPort,
              secure: testPort === 465,
              auth: {
                user: email,
                pass: password,
              },
              connectionTimeout: 5000,
            });

            await transporter.verify();
            result.suggestions.push(`Try using port ${testPort} instead of ${port}`);
            result.configurationStatus.portOpen = true;
            break;
          } catch {
            // Continue testing other ports
          }
        }
      }

      // Add provider-specific suggestions
      if (provider && !result.isValid) {
        result.suggestions.push(`Detected ${provider.name} - follow these steps:`);
        result.suggestions.push(...provider.instructions);
      }

      // General suggestions if no provider detected
      if (!provider && !result.isValid) {
        result.warnings.push('Email provider not automatically detected');
        result.suggestions.push('Verify SMTP settings with your email provider');
        result.suggestions.push('Common ports: 587 (TLS), 465 (SSL), 25 (Plain)');
      }

      // Success suggestions
      if (result.isValid) {
        result.suggestions.push('SMTP configuration is working correctly');
        result.suggestions.push('You can now send emails through this configuration');
      }

    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate optimal SMTP configuration for detected provider
   */
  static generateOptimalConfig(email: string): {
    host: string;
    port: number;
    secure: boolean;
    provider?: EmailProvider;
  } {
    const provider = this.detectProvider(email);
    
    if (provider) {
      return {
        host: provider.smtp.host,
        port: provider.smtp.port,
        secure: provider.smtp.secure,
        provider,
      };
    }

    // Default configuration for unknown providers
    return {
      host: 'smtp.gmail.com', // Most common fallback
      port: 587,
      secure: false,
    };
  }

  /**
   * Quick connection test without authentication
   */
  static async quickConnectionTest(host: string, port: number): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        connectionTimeout: 5000,
        greetingTimeout: 3000,
      });

      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
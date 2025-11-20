import crypto from 'crypto';
import type { FibSettings } from '../shared/schema';

// Encryption key MUST be set in environment variables for security
const ENCRYPTION_KEY = process.env.FIB_CREDENTIALS_ENCRYPTION_KEY || process.env.AWS_CREDENTIALS_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validate encryption key exists
if (!ENCRYPTION_KEY) {
  console.warn('⚠️  FIB_CREDENTIALS_ENCRYPTION_KEY environment variable is not set!');
  console.warn('⚠️  Falling back to AWS_CREDENTIALS_ENCRYPTION_KEY for compatibility.');
}

/**
 * Encrypt sensitive data
 */
export function encryptFibCredential(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key environment variable is not set. Cannot encrypt credentials.');
  }
  
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptFibCredential(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key environment variable is not set. Cannot decrypt credentials.');
  }
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('FIB Decryption error:', error);
    throw new Error('Failed to decrypt FIB credentials');
  }
}

/**
 * Get decrypted FIB credentials from settings
 */
export function getDecryptedFibCredentials(settings: FibSettings): {
  clientId: string;
  clientSecret: string;
} {
  try {
    const clientId = settings.clientId && settings.clientId.includes(':')
      ? decryptFibCredential(settings.clientId)
      : (settings.clientId || '');
    
    const clientSecret = settings.clientSecret && settings.clientSecret.includes(':')
      ? decryptFibCredential(settings.clientSecret)
      : (settings.clientSecret || '');

    return { clientId, clientSecret };
  } catch (error) {
    console.error('Error decrypting FIB credentials:', error);
    throw new Error('Failed to decrypt FIB credentials from database');
  }
}

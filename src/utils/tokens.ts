import crypto from 'crypto';

/**
 * Generate a random token for email verification or password reset
 * @param length - Length of the token (default: 32)
 * @returns Random hexadecimal token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return generateToken(32);
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (): string => {
  return generateToken(32);
};

/**
 * Hash a token (for storing in database)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};




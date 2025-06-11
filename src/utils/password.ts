import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password string
 * @example
 * const hashed = await hashPassword('MySecurePass123!');
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Previously hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 * @example
 * const isValid = await comparePassword('MySecurePass123!', hashedPassword);
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validate password strength against security requirements
 * Requirements: minimum 8 characters, uppercase, lowercase, number, special character
 * @param password - Password string to validate
 * @returns Object with isValid boolean and array of error messages
 * @example
 * const result = validatePasswordStrength('Weak');
 * // Returns: { isValid: false, errors: ['Password must be at least 8 characters long', ...] }
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};





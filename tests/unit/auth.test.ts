import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  TokenPayload,
} from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';
import { UserService } from '../../src/services/user/userService';
import prisma from '../../src/config/database';
import { AppError } from '../../src/middleware/errorHandler';

describe('Authentication Unit Tests', () => {
  describe('Password Utilities', () => {
    describe('hashPassword', () => {
      it('should hash a password', async () => {
        const password = 'Test123!@#';
        const hashed = await hashPassword(password);
        
        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
        expect(hashed.length).toBeGreaterThan(50);
      });

      it('should produce different hashes for same password', async () => {
        const password = 'Test123!@#';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('comparePassword', () => {
      it('should return true for matching passwords', async () => {
        const password = 'Test123!@#';
        const hashed = await hashPassword(password);
        const result = await comparePassword(password, hashed);
        
        expect(result).toBe(true);
      });

      it('should return false for non-matching passwords', async () => {
        const password = 'Test123!@#';
        const wrongPassword = 'Wrong123!@#';
        const hashed = await hashPassword(password);
        const result = await comparePassword(wrongPassword, hashed);
        
        expect(result).toBe(false);
      });
    });

    describe('validatePasswordStrength', () => {
      it('should validate a strong password', () => {
        const result = validatePasswordStrength('Test123!@#');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject password shorter than 8 characters', () => {
        const result = validatePasswordStrength('Test1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject password without uppercase letter', () => {
        const result = validatePasswordStrength('test123!@#');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should reject password without lowercase letter', () => {
        const result = validatePasswordStrength('TEST123!@#');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should reject password without number', () => {
        const result = validatePasswordStrength('TestABC!@#');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should reject password without special character', () => {
        const result = validatePasswordStrength('Test123ABC');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should return multiple errors for weak password', () => {
        const result = validatePasswordStrength('weak');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('JWT Utilities', () => {
    const payload: TokenPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
    };

    describe('generateAccessToken', () => {
      it('should generate a valid access token', () => {
        const token = generateAccessToken(payload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });

      it('should generate valid tokens with same payload', () => {
        const token1 = generateAccessToken(payload);
        const token2 = generateAccessToken(payload);
        
        // Both tokens should be valid and decode to the same payload
        // Note: Tokens generated at the same time will be identical due to same iat
        expect(token1).toBeDefined();
        expect(token2).toBeDefined();
        expect(typeof token1).toBe('string');
        expect(typeof token2).toBe('string');
        
        // Verify both tokens are valid
        const decoded1 = verifyAccessToken(token1);
        const decoded2 = verifyAccessToken(token2);
        
        expect(decoded1.userId).toBe(payload.userId);
        expect(decoded2.userId).toBe(payload.userId);
        expect(decoded1.email).toBe(payload.email);
        expect(decoded2.email).toBe(payload.email);
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate a valid refresh token', () => {
        const token = generateRefreshToken(payload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
      });
    });

    describe('verifyAccessToken', () => {
      it('should verify a valid access token', () => {
        const token = generateAccessToken(payload);
        const verified = verifyAccessToken(token);
        
        expect(verified.userId).toBe(payload.userId);
        expect(verified.email).toBe(payload.email);
        expect(verified.username).toBe(payload.username);
      });

      it('should throw error for invalid token', () => {
        expect(() => {
          verifyAccessToken('invalid.token.here');
        }).toThrow('Invalid or expired access token');
      });

      it('should throw error for expired token', async () => {
        // Generate token with very short expiry (1ms)
        const shortToken = jwt.sign(
          payload,
          process.env.JWT_SECRET as string,
          { expiresIn: '1ms' }
        );
        
        // Wait for token to expire
        await new Promise((resolve) => setTimeout(resolve, 10));
        
        expect(() => {
          verifyAccessToken(shortToken);
        }).toThrow('Invalid or expired access token');
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify a valid refresh token', () => {
        const token = generateRefreshToken(payload);
        const verified = verifyRefreshToken(token);
        
        expect(verified.userId).toBe(payload.userId);
        expect(verified.email).toBe(payload.email);
        expect(verified.username).toBe(payload.username);
      });

      it('should throw error for invalid refresh token', () => {
        expect(() => {
          verifyRefreshToken('invalid.token.here');
        }).toThrow('Invalid or expired refresh token');
      });
    });

    describe('decodeToken', () => {
      it('should decode a valid token', () => {
        const token = generateAccessToken(payload);
        const decoded = decodeToken(token);
        
        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe(payload.userId);
        expect(decoded?.email).toBe(payload.email);
        expect(decoded?.username).toBe(payload.username);
      });

      it('should return null for invalid token', () => {
        const decoded = decodeToken('invalid.token.here');
        expect(decoded).toBeNull();
      });
    });
  });

  describe('UserService Authentication', () => {
    let userService: UserService;
    let testUser: any;

    beforeAll(() => {
      userService = new UserService();
    });

    afterAll(async () => {
      if (testUser) {
        await prisma.user.deleteMany({
          where: {
            email: { in: ['testauth@example.com', 'testlogin@example.com'] },
          },
        });
      }
    });

    describe('createUser', () => {
      it('should create a new user with valid data', async () => {
        const userData = {
          email: 'testauth@example.com',
          username: 'testauth',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        };

        const user = await userService.createUser(userData);
        
        expect(user).toBeDefined();
        expect(user.email).toBe(userData.email);
        expect(user.username).toBe(userData.username);
        expect(user.password).toBeUndefined(); // Password should not be in response
        expect(user.isEmailVerified).toBe(false);
        
        testUser = user;
      });

      it('should throw error for weak password', async () => {
        const userData = {
          email: 'testweak@example.com',
          username: 'testweak',
          password: 'weak',
        };

        await expect(userService.createUser(userData)).rejects.toThrow(AppError);
      });

      it('should throw error for duplicate email', async () => {
        const userData = {
          email: 'testauth@example.com',
          username: 'testauth2',
          password: 'Test123!@#',
        };

        await expect(userService.createUser(userData)).rejects.toThrow('Email already registered');
      });

      it('should throw error for duplicate username', async () => {
        const userData = {
          email: 'testauth2@example.com',
          username: 'testauth',
          password: 'Test123!@#',
        };

        await expect(userService.createUser(userData)).rejects.toThrow('Username already taken');
      });
    });

    describe('login', () => {
      it('should login user with correct credentials', async () => {
        // Create a user first
        const userData = {
          email: 'testlogin@example.com',
          username: 'testlogin',
          password: 'Test123!@#',
        };
        await userService.createUser(userData);

        const result = await userService.login('testlogin@example.com', 'Test123!@#');
        
        expect(result).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(userData.email);
      });

      it('should login user with username', async () => {
        const result = await userService.login('testlogin', 'Test123!@#');
        
        expect(result).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.user.username).toBe('testlogin');
      });

      it('should throw error for incorrect password', async () => {
        await expect(
          userService.login('testlogin@example.com', 'WrongPassword123!@#')
        ).rejects.toThrow('Invalid credentials');
      });

      it('should throw error for non-existent user', async () => {
        await expect(
          userService.login('nonexistent@example.com', 'Test123!@#')
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const user = await userService.findByEmail('testlogin@example.com');
        
        expect(user).toBeDefined();
        expect(user?.email).toBe('testlogin@example.com');
      });

      it('should return null for non-existent email', async () => {
        const user = await userService.findByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });
    });

    describe('findByUsername', () => {
      it('should find user by username', async () => {
        const user = await userService.findByUsername('testlogin');
        
        expect(user).toBeDefined();
        expect(user?.username).toBe('testlogin');
      });

      it('should return null for non-existent username', async () => {
        const user = await userService.findByUsername('nonexistent');
        expect(user).toBeNull();
      });
    });

    describe('findById', () => {
      it('should find user by ID', async () => {
        const loginResult = await userService.login('testlogin@example.com', 'Test123!@#');
        const userId = loginResult.user.id;
        
        const user = await userService.findById(userId);
        
        expect(user).toBeDefined();
        expect(user?.id).toBe(userId);
        expect(user?.password).toBeUndefined();
      });

      it('should return null for non-existent ID', async () => {
        const user = await userService.findById('non-existent-id');
        expect(user).toBeNull();
      });
    });
  });
});


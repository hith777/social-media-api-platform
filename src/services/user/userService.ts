import prisma from '../../config/database';
import { hashPassword, validatePasswordStrength, comparePassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import { User } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/jwt';

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<Omit<User, 'password' | 'refreshToken'>> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new AppError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        400
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<Omit<User, 'password' | 'refreshToken'> | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  /**
   * Login user with email/username and password
   */
  async login(
    identifier: string,
    password: string
  ): Promise<{
    user: Omit<User, 'password' | 'refreshToken'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is inactive', 403);
    }

    // Check if user is deleted
    if (user.deletedAt) {
      throw new AppError('User account has been deleted', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update user with refresh token and last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    // Return user without sensitive data
    const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

    return {
      user: userWithoutSensitive,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by refresh token
    const user = await prisma.user.findFirst({
      where: { refreshToken },
    });

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is inactive', 403);
    }

    // Check if user is deleted
    if (user.deletedAt) {
      throw new AppError('User account has been deleted', 403);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
    }
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return user;
  }

  /**
   * Get user profile by ID (public profile)
   */
  async getProfile(userId: string): Promise<Omit<User, 'password' | 'refreshToken' | 'email'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Get own profile (includes email)
   */
  async getOwnProfile(userId: string): Promise<Omit<User, 'password' | 'refreshToken'> | null> {
    return this.findById(userId);
  }
}

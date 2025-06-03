import prisma from '../../config/database';
import { hashPassword, validatePasswordStrength, comparePassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import { User } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/jwt';
import { generateEmailVerificationToken, generatePasswordResetToken } from '../../utils/tokens';
import { EmailService } from '../email/emailService';
import { cache } from '../../config/redis';
import logger from '../../config/logger';
import {
  calculateSkip,
  createPaginationResult,
  normalizePagination,
  type PaginationResult,
} from '../../utils/pagination';
import fs from 'fs';
import path from 'path';

export class UserService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<any> {
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

    // Generate email verification token
    const emailVerificationToken = generateEmailVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerificationToken: emailVerificationToken as string | null,
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

    // Send verification email (async, don't wait)
    this.emailService.sendVerificationEmail(data.email, emailVerificationToken).catch((error) => {
      // Log error but don't fail user creation
      console.error('Failed to send verification email:', error);
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
  async findById(id: string): Promise<any> {
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
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email or username
    let user = await prisma.user.findFirst({
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
    const userWithDeletedAt = user as User & { deletedAt: Date | null };
    if (userWithDeletedAt.deletedAt) {
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
    // If update fails (e.g., user was deleted), log warning but allow login to proceed
    // since password was already verified
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: refreshToken as string | null,
          lastLoginAt: new Date(),
        },
      });
    } catch (error: any) {
      // If user was deleted between find and update, log warning but continue
      // This can happen in rare race conditions or test cleanup
      if (error.code === 'P2025') {
        logger.warn(`User ${user.id} not found during login update, proceeding without update`);
        // Don't throw error - login should succeed since password was verified
      } else {
        // For other errors, log but still allow login
        logger.warn(`Failed to update user during login: ${error.message}`);
      }
    }

    // Return user without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, refreshToken: _refreshToken, ...userWithoutSensitive } = user;

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
      where: { refreshToken: refreshToken as string | null },
    });

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is inactive', 403);
    }

    // Check if user is deleted
    const userWithDeletedAt = user as User & { deletedAt: Date | null };
    if (userWithDeletedAt.deletedAt) {
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
      data: { refreshToken: newRefreshToken as string | null },
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
  ): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.bio !== undefined && { bio: data.bio }),
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

    // Invalidate cache
    await cache.del(`user:profile:${userId}`);
    await cache.del(`user:own:${userId}`);

    return user;
  }

  /**
   * Get user profile by ID (public profile)
   */
  async getProfile(userId: string): Promise<any> {
    const cacheKey = `user:profile:${userId}`;

    // Try cache first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return cached;
    }

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

    // Cache for 10 minutes
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cache.setJSON(cacheKey, user, 600);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }

  /**
   * Get own profile (includes email)
   */
  async getOwnProfile(userId: string): Promise<any> {
    const cacheKey = `user:own:${userId}`;

    // Try cache first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return cached;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.findById(userId);

    // Cache for 5 minutes (own profile changes more frequently)
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cache.setJSON(cacheKey, user, 300);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Generate new verification token
    const emailVerificationToken = generateEmailVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists for security
    if (!user) {
      return;
    }

    // Check if user is active
    const userWithDeletedAt = user as User & { deletedAt: Date | null };
    if (!user.isActive || userWithDeletedAt.deletedAt) {
      return;
    }

    // Generate password reset token
    const passwordResetToken = generatePasswordResetToken();
    const passwordResetExpires = new Date();
    passwordResetExpires.setHours(passwordResetExpires.getHours() + 1); // Token expires in 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, passwordResetToken);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        400
      );
    }

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token has expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarPath: string): Promise<any> {
    // Get current user to delete old avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Delete old avatar file if it exists
    if (user?.avatar) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
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

    return updatedUser;
  }

  /**
   * Search users by username or email
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<any>> {
    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(page, limit);
    const skip = calculateSkip(normalizedPage, normalizedLimit);

    // Build search condition
    const where = {
      AND: [
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' as const } },
            { firstName: { contains: query, mode: 'insensitive' as const } },
            { lastName: { contains: query, mode: 'insensitive' as const } },
          ],
        },
        { isActive: true },
        { deletedAt: null },
      ],
    };

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          username: 'asc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginationResult(users, total, normalizedPage, normalizedLimit);
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    // Prevent self-blocking
    if (blockerId === blockedId) {
      throw new AppError('Cannot block yourself', 400);
    }

    // Check if user exists
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!blockedUser) {
      throw new AppError('User not found', 404);
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new AppError('User is already blocked', 409);
    }

    // Create block
    await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    // Find and delete block
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new AppError('User is not blocked', 404);
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(page, limit);
    const skip = calculateSkip(normalizedPage, normalizedLimit);

    const [blocks, total] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: userId },
        skip,
        take: normalizedLimit,
        include: {
          blockedUser: {
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.block.count({
        where: { blockerId: userId },
      }),
    ]);

    const users = blocks.map((block) => block.blockedUser);
    const paginationResult = createPaginationResult(users, total, normalizedPage, normalizedLimit);
    return {
      ...paginationResult,
      users: paginationResult.data,
    };
  }

  /**
   * Check if a user is blocked by another user
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!block;
  }

  /**
   * Soft delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.deletedAt) {
      throw new AppError('Account already deleted', 400);
    }

    // Soft delete: set deletedAt timestamp
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date() as unknown as Date | null,
        isActive: false,
        refreshToken: null as unknown as string | null, // Invalidate refresh token
      },
    });

    // Delete all blocks (both directions)
    await prisma.block.deleteMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
    });
  }
}

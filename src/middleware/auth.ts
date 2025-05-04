import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import { asyncHandler } from './errorHandler';
import prisma from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & {
        id: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is inactive', 403);
    }

    if ((user as any).deletedAt) {
      throw new AppError('User account has been deleted', 403);
    }

    // Attach user to request
    req.user = {
      ...decoded,
      id: user.id,
    };

    next();
  }
);

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user && user.isActive && !(user as any).deletedAt) {
        req.user = {
          ...decoded,
          id: user.id,
        };
      }
    } catch {
      // Ignore token errors for optional auth
    }

    next();
  }
);



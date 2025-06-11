import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Generate a JWT access token for user authentication
 * @param payload - Token payload containing user information
 * @param payload.userId - User ID
 * @param payload.email - User email
 * @param payload.username - Username
 * @returns Signed JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN as string | number,
  } as SignOptions);
};

/**
 * Generate a JWT refresh token for obtaining new access tokens
 * @param payload - Token payload containing user information
 * @returns Signed JWT refresh token with longer expiration
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string | number,
  } as SignOptions);
};

/**
 * Verify and decode a JWT access token
 * @param token - JWT access token string
 * @returns Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify and decode a JWT refresh token
 * @param token - JWT refresh token string
 * @returns Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode a JWT token without verification (for debugging purposes only)
 * @param token - JWT token string
 * @returns Decoded token payload or null if decoding fails
 * @warning This does not verify the token signature - use verifyAccessToken or verifyRefreshToken for authentication
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};



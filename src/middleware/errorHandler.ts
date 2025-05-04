import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Determine status code early to decide logging level
  let statusCode = 500;
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err instanceof ZodError) {
    statusCode = 400;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
    } else if (err.code === 'P2025') {
      statusCode = 404;
    }
  }

  // Only log unexpected errors (5xx) in test mode, or all errors in dev/prod
  // Expected client errors (4xx) are normal and don't need logging in test mode
  if (process.env.NODE_ENV === 'test') {
    if (statusCode >= 500) {
      logger.error('Unexpected error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
  } else {
    // In dev/prod, log all errors but use appropriate level
    if (statusCode >= 500) {
      logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    } else {
      // Log 4xx errors at debug level in development
      logger.debug('Client error:', {
        error: err.message,
        path: req.path,
        method: req.method,
        statusCode,
      });
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Duplicate entry. This record already exists.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
      return;
    }
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle unexpected errors
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


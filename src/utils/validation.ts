import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Post content validation
export const postContentSchema = z
  .string()
  .min(1, 'Post content cannot be empty')
  .max(5000, 'Post content cannot exceed 5000 characters');

// Post visibility validation
export const postVisibilitySchema = z.enum(['public', 'private', 'friends'], {
  errorMap: () => ({ message: 'Visibility must be public, private, or friends' }),
});

// Media URLs validation
export const mediaUrlsSchema = z
  .array(z.string().url('Invalid media URL'))
  .max(10, 'Maximum 10 media files allowed per post')
  .optional();

// Report reason validation
export const reportReasonSchema = z
  .string()
  .min(1, 'Report reason is required')
  .max(200, 'Report reason cannot exceed 200 characters');

// Comment content validation
export const commentContentSchema = z
  .string()
  .min(1, 'Comment content cannot be empty')
  .max(2000, 'Comment content cannot exceed 2000 characters');

// Batch request validation
export const batchRequestSchema = z.object({
  requests: z
    .array(
      z.object({
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        path: z.string().min(1, 'Path is required'),
        body: z.any().optional(),
        headers: z.record(z.string()).optional(),
      })
    )
    .min(1, 'At least one request is required')
    .max(20, 'Maximum 20 requests per batch'),
});



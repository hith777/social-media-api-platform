import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Compression filter function
 * Determines which responses should be compressed
 */
function compressionFilter(req: Request, res: Response): boolean {
  // Don't compress responses if explicitly requested not to
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Use compression for all text-based content types
  return compression.filter(req, res);
}

/**
 * Configure compression middleware with optimized settings
 */
export const compressionMiddleware = compression({
  // Compression level (0-9, where 9 is maximum compression)
  // Level 6 provides a good balance between compression and CPU usage
  level: 6,

  // Only compress responses above this threshold (in bytes)
  // Small responses don't benefit much from compression
  threshold: 1024, // 1KB

  // Filter function to determine which responses to compress
  filter: compressionFilter,

  // Compression strategy
  // 'default' uses zlib's default strategy (balanced)
  // Other options: 'filtered', 'huffman-only', 'rle', 'fixed'
  strategy: undefined, // Use default strategy

  // Memory level for compression (1-9)
  // Higher values use more memory but compress faster
  memLevel: 8,

  // Window bits (8-15)
  // Higher values provide better compression but use more memory
  windowBits: 15,
});



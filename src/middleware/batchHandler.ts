import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { z } from 'zod';

/**
 * Batch request schema
 */
const batchRequestSchema = z.object({
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

export type BatchRequest = z.infer<typeof batchRequestSchema>;

/**
 * Batch response type
 */
export interface BatchResponse {
  responses: Array<{
    status: number;
    headers: Record<string, string>;
    body: any;
    error?: string;
  }>;
}

/**
 * Validate batch request
 */
export function validateBatchRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const validated = batchRequestSchema.parse(req.body);
    (req as any).batchRequests = validated.requests;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(
        new AppError(
          `Invalid batch request: ${error.errors.map((e) => e.message).join(', ')}`,
          400
        )
      );
      return;
    }
    next(error);
  }
}

/**
 * Execute a single batch request
 */
async function executeBatchRequest(
  _req: Request,
  method: string,
  path: string,
  _body?: any,
  _customHeaders?: Record<string, string>
): Promise<{ status: number; headers: Record<string, string>; body: any }> {
  // Note: This is a simplified implementation
  // In a real scenario, you'd need to properly route the request through your Express app
  // For now, we'll return an error indicating this needs to be implemented per-route
  return {
    status: 501,
    headers: {},
    body: {
      error: 'Batch request execution not yet implemented for this path',
      path,
      method,
    },
  };
}

/**
 * Process batch requests
 * Note: This is a framework for batch processing. Actual execution
 * would need to be integrated with the Express router or use a library
 * like express-batch or implement custom routing logic.
 */
export async function processBatchRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const batchRequests = (req as any).batchRequests as Array<{
    method: string;
    path: string;
    body?: any;
    headers?: Record<string, string>;
  }>;

  if (!batchRequests || batchRequests.length === 0) {
    next(new AppError('No batch requests provided', 400));
    return;
  }

  // Execute all batch requests in parallel
  const results = await Promise.allSettled(
    batchRequests.map((batchReq) =>
      executeBatchRequest(
        req,
        batchReq.method,
        batchReq.path,
        batchReq.body,
        batchReq.headers
      )
    )
  );

  // Format responses
  const responses = results.map((result) => {
    if (result.status === 'fulfilled') {
      return {
        status: result.value.status,
        headers: result.value.headers,
        body: result.value.body,
      };
    } else {
      return {
        status: 500,
        headers: {},
        body: null,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  const batchResponse: BatchResponse = {
    responses,
  };

  res.status(200).json(batchResponse);
}


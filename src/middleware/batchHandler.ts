import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { authenticate } from './auth';
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
  req: Request,
  method: string,
  path: string,
  body?: any,
  customHeaders?: Record<string, string>
): Promise<{ status: number; headers: Record<string, string>; body: any }> {
  // Create a mock request object for the batch request
  const mockReq = {
    ...req,
    method: method.toUpperCase(),
    path,
    url: path,
    originalUrl: path,
    body: body || {},
    headers: {
      ...req.headers,
      ...customHeaders,
    },
    query: {},
    params: {},
  } as any;

  // Create a mock response object to capture the response
  const mockRes = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.body = data;
      return this;
    },
    send: function (data: any) {
      this.body = data;
      return this;
    },
    setHeader: function (name: string, value: string) {
      this.headers[name] = value;
    },
  } as any;

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
  const responses = results.map((result, index) => {
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


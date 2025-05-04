import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';
import { asyncHandler } from './errorHandler';

// Request validation schema type
type RequestValidationSchema = z.ZodObject<{
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}>;

export const validate = (schema: RequestValidationSchema) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Build validation object with only fields that exist in schema
      const validationInput: any = {};
      const shape = schema.shape;

      if (shape.body) {
        validationInput.body = req.body || {};
      }
      if (shape.query) {
        validationInput.query = req.query || {};
      }
      if (shape.params) {
        validationInput.params = req.params || {};
      }

      // Validate request body, query, and params
      const validatedData = await schema.parseAsync(validationInput);

      // Replace request data with validated data
      if (validatedData.body !== undefined) {
        req.body = validatedData.body;
      }
      if (validatedData.query !== undefined) {
        req.query = validatedData.query as typeof req.query;
      }
      if (validatedData.params !== undefined) {
        req.params = validatedData.params as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  });
};

// Helper function to validate only body
export const validateBody = (schema: ZodSchema) => {
  return validate(
    z.object({
      body: schema,
      query: z.any().optional(),
      params: z.any().optional(),
    })
  );
};

// Helper function to validate only query
export const validateQuery = (schema: ZodSchema) => {
  return validate(
    z.object({
      query: schema,
      body: z.any().optional(),
      params: z.any().optional(),
    })
  );
};

// Helper function to validate only params
export const validateParams = (schema: ZodSchema) => {
  return validate(
    z.object({
      params: schema,
      body: z.any().optional(),
      query: z.any().optional(),
    })
  );
};


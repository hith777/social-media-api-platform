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
      // Validate request body, query, and params
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      if (validatedData.body) {
        req.body = validatedData.body;
      }
      if (validatedData.query) {
        req.query = validatedData.query as typeof req.query;
      }
      if (validatedData.params) {
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
    })
  );
};

// Helper function to validate only query
export const validateQuery = (schema: ZodSchema) => {
  return validate(
    z.object({
      query: schema,
    })
  );
};

// Helper function to validate only params
export const validateParams = (schema: ZodSchema) => {
  return validate(
    z.object({
      params: schema,
    })
  );
};


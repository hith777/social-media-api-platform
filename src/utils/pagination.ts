/**
 * Pagination utilities for consistent pagination handling
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasNextPage: boolean;
  limit: number;
}

/**
 * Calculate the number of records to skip for pagination
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Number of items to skip
 * @example calculateSkip(2, 10) returns 10
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate the total number of pages based on total items and items per page
 * @param total - Total number of items
 * @param limit - Number of items per page
 * @returns Total number of pages (rounded up)
 * @example calculateTotalPages(25, 10) returns 3
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Validate and normalize pagination parameters to ensure valid values
 * @param page - Page number (defaults to 1 if invalid)
 * @param limit - Items per page (defaults to defaultLimit if invalid)
 * @param maxLimit - Maximum allowed items per page (default: 100)
 * @param defaultLimit - Default items per page (default: 10)
 * @returns Normalized pagination parameters
 * @example normalizePagination(0, 200, 100, 10) returns { page: 1, limit: 100 }
 */
export function normalizePagination(
  page?: number,
  limit?: number,
  maxLimit: number = 100,
  defaultLimit: number = 10
): PaginationParams {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(
    maxLimit,
    Math.max(1, limit || defaultLimit)
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

/**
 * Create a standardized pagination result object with metadata
 * @param data - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination result object with data and metadata
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = calculateTotalPages(total, limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Create cursor pagination result
 */
export function createCursorPaginationResult<T>(
  data: T[],
  limit: number,
  getCursor: (item: T) => string
): CursorPaginationResult<T> {
  const hasNextPage = data.length > limit;
  const items = hasNextPage ? data.slice(0, limit) : data;
  const nextCursor = hasNextPage && items.length > 0
    ? getCursor(items[items.length - 1])
    : undefined;

  return {
    data: items,
    nextCursor,
    hasNextPage,
    limit,
  };
}

/**
 * Parse cursor (assuming it's a base64 encoded JSON string with timestamp and id)
 */
export function parseCursor(cursor?: string): { timestamp: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      timestamp: new Date(parsed.timestamp),
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

/**
 * Create cursor from timestamp and id
 */
export function createCursor(timestamp: Date, id: string): string {
  const payload = JSON.stringify({ timestamp: timestamp.toISOString(), id });
  return Buffer.from(payload).toString('base64');
}



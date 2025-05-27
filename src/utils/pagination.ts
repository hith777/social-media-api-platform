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
 * Calculate pagination skip value
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Validate and normalize pagination parameters
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
 * Create pagination result with metadata
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



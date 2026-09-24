import { NextResponse } from "next/server";

export interface ApiResponseOptions {
  status?: number;
  headers?: HeadersInit;
}

export interface ApiPaginationMeta {
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Standard success JSON response helper
 */
export function successResponse<T>(
  data?: T,
  message = "Success",
  options: ApiResponseOptions = {}
) {
  const { status = 200, headers } = options;

  return NextResponse.json(
    {
      status: "success",
      message,
      ...(data !== undefined ? { data } : {}),
    },
    { status, headers }
  );
}

/**
 * Standard paginated or list success JSON response helper
 */
export function paginatedResponse<T>(
  data: T[],
  meta: ApiPaginationMeta,
  message = "Success",
  options: ApiResponseOptions = {}
) {
  const { status = 200, headers } = options;

  return NextResponse.json(
    {
      status: "success",
      message,
      ...meta,
      data,
    },
    { status, headers }
  );
}

/**
 * Standard error JSON response helper
 */
export function errorResponse(
  message = "An error occurred",
  status = 500,
  errors?: Record<string, any> | any[] | string
) {
  return NextResponse.json(
    {
      status: "error",
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}

/**
 * Specialized helpers
 */
export function badRequestResponse(message = "Bad request", errors?: any) {
  return errorResponse(message, 400, errors);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404);
}

export function conflictResponse(message = "Conflict occurred") {
  return errorResponse(message, 409);
}

export function internalServerErrorResponse(message = "Internal server error") {
  return errorResponse(message, 500);
}

import {
  AuthError,
  NotFoundError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors";
import { ZodError } from "zod";
import { getZodFieldErrors } from "@/utils/errorUtils";

/**
 * Creates a standardized JSON response
 */
export function createApiResponse(
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates an error response with automatic status code detection
 */
export function createApiError(error: unknown): Response {
  let statusCode = 500;
  let message = "Internal server error";
  let fieldErrors: Record<string, string[]> | undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createApiResponse(
      {
        error: error.issues[0].message,
        fieldErrors: getZodFieldErrors(error),
      },
      400
    );
  }

  // Handle custom errors (with status codes)
  if (error instanceof AuthError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof DatabaseError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return createApiResponse(
    { error: message, ...(fieldErrors && { fieldErrors }) },
    statusCode
  );
}

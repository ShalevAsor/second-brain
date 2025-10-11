import { getErrorMessage, getZodFieldErrors } from "@/utils/errorUtils";
import { ZodError } from "zod";
import type { ActionResult } from "@/types/actionTypes";

type ErrorOptions = {
  error?: unknown;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Creates a success action result
 */
export function createSuccessResult<T>(
  data: T,
  message?: string
): ActionResult<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Creates an error action result
 * Automatically handles ZodError and other error types
 */
export function createErrorResult(
  opts: ErrorOptions | string
): ActionResult<never> {
  // If it's just a string, treat it as the error message
  if (typeof opts === "string") {
    return {
      success: false,
      error: opts,
    };
  }

  // Handle ZodError specially
  if (opts.error instanceof ZodError) {
    return {
      success: false,
      error: opts.error.issues[0].message,
      fieldErrors: getZodFieldErrors(opts.error),
    };
  }

  // Otherwise, use error message or get from error utils
  return {
    success: false,
    error: opts.message || getErrorMessage(opts.error) || "Unknown error",
    ...(opts.fieldErrors && { fieldErrors: opts.fieldErrors }),
  };
}

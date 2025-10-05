import { getErrorMessage } from "@/utils/errorUtils";

export type ActionResult<T = unknown> =
  | {
      success: true;
      data: T;
      message?: string; // Optional success message
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

// Helper functions
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

// Error helper (flexible - takes message OR error object)
type ErrorOptions = {
  error?: unknown;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export function createErrorResult(
  opts: ErrorOptions | string // Can pass just a string OR options object
): ActionResult<never> {
  // If it's just a string, treat it as the error message
  if (typeof opts === "string") {
    return {
      success: false,
      error: opts,
    };
  }

  // Otherwise, it's an options object
  return {
    success: false,
    error: opts.message || getErrorMessage(opts.error) || "Unknown error",
    ...(opts.fieldErrors && { fieldErrors: opts.fieldErrors }),
  };
}

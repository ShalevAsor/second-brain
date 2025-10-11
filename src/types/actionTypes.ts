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

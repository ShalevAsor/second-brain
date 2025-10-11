/**
 * Custom error classes for API routes with HTTP status codes
 */

export class AuthError extends Error {
  statusCode = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  statusCode = 400;

  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends Error {
  statusCode = 500;

  constructor(message: string = "Database error") {
    super(message);
    this.name = "DatabaseError";
  }
}

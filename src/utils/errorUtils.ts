import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function getErrorMessage(error: unknown): string {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    return firstError?.message || "Invalid data provided";
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes("clerkId")) {
          return "This account already exists";
        }
        if (target?.includes("email")) {
          return "This email is already registered";
        }
        return "This record already exists";
      case "P2003":
        return "Invalid reference - related data may have been deleted";
      case "P2025":
        return "Record not found";
      case "P2034":
        return "A conflict occurred. Please try again.";
      default:
        console.error("Unhandled Prisma error:", error.code, error.message);
        return "Database error occurred";
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error("Unknown Prisma error:", error.message);
    return "Database connection error";
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", error.message);
    return "Invalid data format";
  }

  if (error instanceof Error) {
    return error.message || "Unknown error";
  }

  return "Unknown error";
}

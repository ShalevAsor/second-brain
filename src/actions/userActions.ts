"use server";

import { auth } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types/actionTypes";
import { createSuccessResult, createErrorResult } from "@/types/actionTypes";

/**
 * Gets the current authenticated user
 * If the user is not authenticated, returns null
 *
 * @returns The user object or null if not authenticated/not found
 */

export async function getCurrentUser(): Promise<ActionResult<User>> {
  try {
    // get the current authentication session from clerk
    const { userId } = await auth();
    if (!userId) {
      logger.debug("User not authenticated");
      return createErrorResult("Not authenticated");
    }
    // Find the user in our database based on Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (!user) {
      logger.debug(
        { clerkId: userId },
        "User with clerkId not found in database"
      );
      return createErrorResult("User not found");
    }
    return createSuccessResult(user);
  } catch (error) {
    logger.error({ error }, "Error getting current user");
    return createErrorResult({ error });
  }
}

/**
 * Creates a new user in the database and sends a welcome email
 *
 * @returns The user object or null if not authenticated/not found
 */

export async function createUser(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ActionResult<User>> {
  try {
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        // Store firstName and last name if provided
        firstName: firstName || null,
        lastName: lastName || null,
      },
    });
    logger.info({ userId: newUser.id }, "User created");
    // TODO: send welcome email
    return createSuccessResult(newUser, "User created successfully");
  } catch (error) {
    logger.error({ error }, "Error creating a user");
    return createErrorResult({ error });
  }
}

/**
 * Updates an existing user in the database
 */
export async function updateUser(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ActionResult<User>> {
  try {
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        email,
        firstName,
        lastName,
      },
    });

    logger.debug({ id: updatedUser.id }, "Updated user");
    return createSuccessResult(updatedUser, "User updated successfully");
  } catch (error) {
    logger.error({ error }, "Error updating user");
    return createErrorResult({ error });
  }
}

/**
 * Deletes a user from the database
 */
export async function deleteUser(clerkId: string): Promise<ActionResult> {
  try {
    await prisma.user.delete({
      where: { clerkId },
    });

    logger.debug({ clerkId }, "User deleted");
    return createSuccessResult("User deleted successfully");
  } catch (error) {
    logger.error({ error }, "Error deleting user");
    return createErrorResult({ error });
  }
}

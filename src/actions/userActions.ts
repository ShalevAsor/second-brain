"use server";

import { User } from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types/actionTypes";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import { createInboxFolder } from "./folderActions";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Gets the current authenticated user
 * Creates the user if they don't exist in the database yet
 *
 * @returns The user object or error
 */
export async function getCurrentUser(): Promise<ActionResult<User>> {
  try {
    // Get the current authentication session from clerk
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return createErrorResult("Not authenticated");
    }

    // Try to find the user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    // If user doesn't exist, create them (handles race condition with webhook)
    if (!user) {
      logger.debug(
        { clerkId: clerkUserId },
        "User not found in database, fetching from Clerk to create"
      );

      // Fetch user details from Clerk
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return createErrorResult("User not found in Clerk");
      }

      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      );

      if (!primaryEmail) {
        return createErrorResult("No primary email found");
      }

      // Create user (idempotent - won't fail if webhook already created it)
      const createResult = await createUser(
        clerkUserId,
        primaryEmail.emailAddress,
        clerkUser.firstName || undefined,
        clerkUser.lastName || undefined
      );

      if (!createResult.success) {
        return createErrorResult("Failed to create user");
      }

      user = createResult.data;
    }

    return createSuccessResult(user);
  } catch (error) {
    logger.error({ error }, "Error getting current user");
    return createErrorResult({ error });
  }
}

/**
 * Creates a new user in the database (idempotent - safe to call multiple times)
 * If user already exists, returns the existing user
 *
 * @returns The user object
 */

export async function createUser(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ActionResult<User>> {
  try {
    // Try to find existing user first
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      logger.debug({ userId: existingUser.id }, "User already exists");
      return createSuccessResult(existingUser, "User already exists");
    }

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
    // Create inbox folder for new user
    const inboxResult = await createInboxFolder(newUser.id);
    if (!inboxResult.success) {
      logger.error("Failed to create inbox folder:", {
        userId: newUser.id,
        error: inboxResult.error,
      });
    }
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

// src/lib/auth.ts

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Gets the authenticated user's database ID
 * Throws generic Error if not authenticated or user not found
 *
 * @returns Database user ID (not Clerk ID)
 */
export async function requireAuth(): Promise<string> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.id;
}

/**
 * Gets the full authenticated user from database
 */
export async function requireUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

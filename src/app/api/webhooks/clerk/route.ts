import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { createUser, deleteUser, updateUser } from "@/actions/userActions";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // verify webhook using clerk helper
    const evt = await verifyWebhook(req);
    // Get the event type
    const eventType = evt.type;
    const { id } = evt.data;
    logger.debug(
      `Received webhook with ID ${id} and event type of ${eventType}`
    );
    // Handle different event types
    switch (eventType) {
      case "user.created": {
        const {
          id: clerkId,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
        } = evt.data;

        // Find the primary email address
        const primaryEmail = email_addresses.find(
          (email) => email.id === primary_email_address_id
        );

        if (!primaryEmail) {
          console.error("No primary email found for user");
          return new Response("No primary email found", { status: 400 });
        }
        // create user
        const result = await createUser(
          clerkId,
          primaryEmail.email_address,
          first_name || undefined,
          last_name || undefined
        );
        if (!result.success) {
          return new Response(result.error, { status: 500 });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      case "user.updated": {
        const {
          id: clerkId,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
        } = evt.data;
        // Find the primary email address
        const primaryEmail = email_addresses.find(
          (email) => email.id === primary_email_address_id
        );

        if (!primaryEmail) {
          logger.error("No primary email found for user");
          return new Response("No primary email found", { status: 400 });
        }
        // Use the server action to update the user
        const result = await updateUser(
          clerkId,
          primaryEmail.email_address,
          first_name || undefined,
          last_name || undefined
        );
        if (!result.success) {
          return new Response(result.error, { status: 500 });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      case "user.deleted": {
        const { id: clerkId } = evt.data;
        // Make sure clerkId is defined
        if (!clerkId) {
          console.error("No Clerk ID found for deleted user");
          return new Response("Missing Clerk ID", { status: 400 });
        }
        const result = await deleteUser(clerkId);
        if (!result.success) {
          return new Response(result.error, { status: 500 });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      default:
        // For other event types, just acknowledge receipt
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    logger.error("Error verifying webhook:", { error });
    return new Response("Error verifying webhook", { status: 400 });
  }
}

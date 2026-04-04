import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events to sync user data to MongoDB.
 */
export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  // Get the Svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;

  switch (eventType) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return NextResponse.json({ error: "No email" }, { status: 400 });
      }

      await db.user.upsert({
        where: { clerkId: id },
        update: {
          email: primaryEmail,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
        create: {
          clerkId: id,
          email: primaryEmail,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
      });

      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      if (id) {
        await db.user.deleteMany({ where: { clerkId: id } });
      }
      break;
    }

    default:
      console.log(`[Clerk Webhook] Unhandled event: ${eventType}`);
  }

  return NextResponse.json({ success: true });
}

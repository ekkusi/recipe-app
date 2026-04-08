import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteAllUserData } from "@/lib/db/account";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  const headers = {
    "svix-id": req.headers.get("svix-id") || "",
    "svix-signature": req.headers.get("svix-signature") || "",
    "svix-timestamp": req.headers.get("svix-timestamp") || "",
  };

  let event: WebhookEvent;

  try {
    const body = await req.text();
    event = wh.verify(body, headers) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Handle user.deleted event
  if (event.type === "user.deleted" && event.data.id) {
    const userId = event.data.id;
    try {
      await deleteAllUserData(userId);
      console.log(`Deleted all data for user ${userId}`);
    } catch (err) {
      console.error(`Failed to delete data for user ${userId}:`, err);
      // Still return 200 to acknowledge receipt, even if deletion failed
      // This prevents Clerk from retrying forever
    }
  }

  return NextResponse.json({ received: true });
}

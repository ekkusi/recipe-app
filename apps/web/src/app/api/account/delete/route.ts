import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteAllUserData } from "@/lib/db/account";

export async function DELETE() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all user data from Supabase
    await deleteAllUserData(userId);

    // Delete Clerk user (this invalidates all sessions for this user)
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

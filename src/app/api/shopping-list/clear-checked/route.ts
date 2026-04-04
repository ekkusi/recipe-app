import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clearCheckedItems } from "@/lib/db/shopping-list";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearCheckedItems(userId);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clearCheckedItems, getOrCreateDefaultList } from "@/lib/db/shopping-list";

// Legacy route — uses user's default list
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const defaultList = await getOrCreateDefaultList(userId);
  await clearCheckedItems(defaultList.id, userId);
  return NextResponse.json({ ok: true });
}

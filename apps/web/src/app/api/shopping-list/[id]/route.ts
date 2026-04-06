import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toggleShoppingItem, deleteShoppingItem, getOrCreateDefaultList } from "@/lib/db/shopping-list";

// Legacy route — resolves listId from user's default list
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const defaultList = await getOrCreateDefaultList(userId);
  const { checked } = await req.json();
  await toggleShoppingItem(id, checked, defaultList.id, userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const defaultList = await getOrCreateDefaultList(userId);
  await deleteShoppingItem(id, defaultList.id, userId);
  return NextResponse.json({ ok: true });
}

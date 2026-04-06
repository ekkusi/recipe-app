import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toggleShoppingItem, updateShoppingItem, deleteShoppingItem } from "@/lib/db/shopping-list";

type Params = { params: Promise<{ listId: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { listId, itemId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if ("checked" in body) {
    await toggleShoppingItem(itemId, body.checked, listId, userId);
  } else {
    const { name, quantity, unit } = body;
    await updateShoppingItem(itemId, { name, quantity, unit }, listId, userId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { listId, itemId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteShoppingItem(itemId, listId, userId);
  return NextResponse.json({ ok: true });
}

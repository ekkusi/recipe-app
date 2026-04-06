import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getListItems, renameShoppingList, deleteShoppingList } from "@/lib/db/shopping-list";

type Params = { params: Promise<{ listId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getListItems(listId, userId);
  return NextResponse.json(items);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  await renameShoppingList(listId, userId, name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteShoppingList(listId, userId);
  return NextResponse.json({ ok: true });
}

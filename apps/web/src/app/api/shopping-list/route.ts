import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getListItems, addShoppingItem, getOrCreateDefaultList } from "@/lib/db/shopping-list";

// Legacy route — uses user's default list
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const defaultList = await getOrCreateDefaultList(userId);
  const items = await getListItems(defaultList.id, userId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const defaultList = await getOrCreateDefaultList(userId);
  const body = await req.json();
  const item = await addShoppingItem(defaultList.id, userId, {
    name: body.name,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
  });
  return NextResponse.json(item);
}

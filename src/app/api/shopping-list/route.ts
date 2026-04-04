import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getShoppingList, addShoppingItem } from "@/lib/db/shopping-list";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getShoppingList(userId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await addShoppingItem(userId, {
    name: body.name,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
  });
  return NextResponse.json(item);
}

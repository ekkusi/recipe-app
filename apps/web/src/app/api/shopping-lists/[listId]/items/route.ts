import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addShoppingItem } from "@/lib/db/shopping-list";

type Params = { params: Promise<{ listId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await addShoppingItem(listId, userId, {
    name: body.name,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
  });
  return NextResponse.json(item);
}

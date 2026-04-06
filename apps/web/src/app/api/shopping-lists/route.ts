import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getLists, getOrCreateDefaultList, createShoppingList } from "@/lib/db/shopping-list";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await getLists(userId);
  if (lists.length === 0) {
    // Auto-create "Oma" on first access
    const defaultList = await getOrCreateDefaultList(userId);
    return NextResponse.json([defaultList]);
  }
  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const list = await createShoppingList(userId, name);
  return NextResponse.json(list);
}

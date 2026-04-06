import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { joinShoppingList } from "@/lib/db/shopping-list";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  const listId = await joinShoppingList(token, userId);
  return NextResponse.json({ listId });
}

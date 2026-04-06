import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addShoppingItems, getOrCreateDefaultList } from "@/lib/db/shopping-list";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ingredients, listId } = await req.json();

  let resolvedListId: string;
  if (listId) {
    resolvedListId = listId;
  } else {
    const defaultList = await getOrCreateDefaultList(userId);
    resolvedListId = defaultList.id;
  }

  await addShoppingItems(
    resolvedListId,
    userId,
    ingredients.map((ing: { name: string; quantity: number | null; unit: string | null }) => ({
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
    }))
  );
  return NextResponse.json({ ok: true });
}

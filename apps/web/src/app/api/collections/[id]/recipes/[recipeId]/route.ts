import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { removeRecipeFromCollection } from "@/lib/db/collections";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id, recipeId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await removeRecipeFromCollection(id, recipeId, userId);
  return NextResponse.json({ ok: true });
}

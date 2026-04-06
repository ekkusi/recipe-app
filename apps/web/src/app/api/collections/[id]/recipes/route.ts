import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addRecipeToCollection } from "@/lib/db/collections";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId } = await req.json();
  await addRecipeToCollection(id, recipeId, userId);
  return NextResponse.json({ ok: true });
}

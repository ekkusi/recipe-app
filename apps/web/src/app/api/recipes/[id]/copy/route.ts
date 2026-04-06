import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRecipeById, copyRecipe } from "@/lib/db/recipes";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const source = await getRecipeById(id);
    if (source.is_private && source.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const newId = await copyRecipe(id, userId);
    return NextResponse.json({ id: newId });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

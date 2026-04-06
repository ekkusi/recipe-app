import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRecipeById, updateRecipe, deleteRecipe } from "@/lib/db/recipes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  try {
    const recipe = await getRecipeById(id);
    if (recipe.is_private && recipe.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ingredients = (body.ingredients ?? [])
    .filter((ing: { name: string }) => ing.name.trim())
    .map((ing: { name: string; quantity: string; unit: string }, i: number) => ({
      name: ing.name.trim(),
      quantity: ing.quantity ? parseFloat(ing.quantity) : null,
      unit: ing.unit || null,
      sort_order: i,
    }));

  const instructions = (body.instructions ?? [])
    .filter((ins: { content: string }) => ins.content.trim())
    .map((ins: { content: string }, i: number) => ({
      step_number: i + 1,
      content: ins.content.trim(),
    }));

  await updateRecipe(id, userId, {
    title: body.title,
    description: body.description ?? "",
    difficulty: body.difficulty || null,
    time_minutes: body.time_minutes ? parseInt(body.time_minutes) : null,
    ingredients,
    instructions,
    tag_ids: body.tag_ids ?? [],
    is_private: body.is_private ?? false,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteRecipe(id, userId);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRecipe } from "@/lib/db/recipes";

export async function POST(req: NextRequest) {
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
    .filter((s: string) => s.trim())
    .map((content: string, i: number) => ({
      step_number: i + 1,
      content: content.trim(),
    }));

  const id = await createRecipe(userId, {
    title: body.title,
    description: body.description ?? "",
    difficulty: body.difficulty || null,
    time_minutes: body.time_minutes ? parseInt(body.time_minutes) : null,
    ingredients,
    instructions,
    tag_ids: body.tag_ids ?? [],
  });

  return NextResponse.json({ id });
}

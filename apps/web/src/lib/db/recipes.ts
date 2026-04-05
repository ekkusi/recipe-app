import { createServiceClient } from "@/lib/supabase/server";

import type { Difficulty, Ingredient, Instruction, Tag, Recipe, RecipeFormData } from "@recipe-app/shared";

export async function getRecipes(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      id, title, description, difficulty, time_minutes, created_at,
      recipe_tags ( tag_id, tags ( id, name ) )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRecipe(id: string, userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      id, user_id, title, description, difficulty, time_minutes, created_at,
      recipe_ingredients ( id, name, quantity, unit, sort_order ),
      recipe_instructions ( id, step_number, content ),
      recipe_tags ( tag_id, tags ( id, name ) )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as Recipe;
}

export async function createRecipe(userId: string, data: RecipeFormData) {
  const supabase = createServiceClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      difficulty: data.difficulty,
      time_minutes: data.time_minutes,
    })
    .select("id")
    .single();
  if (error) throw error;

  await Promise.all([
    data.ingredients.length > 0 &&
    supabase.from("recipe_ingredients").insert(
      data.ingredients.map((ing) => ({ ...ing, recipe_id: recipe.id }))
    ),
    data.instructions.length > 0 &&
    supabase.from("recipe_instructions").insert(
      data.instructions.map((ins) => ({ ...ins, recipe_id: recipe.id }))
    ),
    data.tag_ids.length > 0 &&
    supabase.from("recipe_tags").insert(
      data.tag_ids.map((tag_id) => ({ recipe_id: recipe.id, tag_id }))
    ),
  ]);

  return recipe.id;
}

export async function updateRecipe(
  id: string,
  userId: string,
  data: RecipeFormData
) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("recipes")
    .update({
      title: data.title,
      description: data.description || null,
      difficulty: data.difficulty,
      time_minutes: data.time_minutes,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  // Replace ingredients, instructions, tags
  await Promise.all([
    supabase.from("recipe_ingredients").delete().eq("recipe_id", id),
    supabase.from("recipe_instructions").delete().eq("recipe_id", id),
    supabase.from("recipe_tags").delete().eq("recipe_id", id),
  ]);

  await Promise.all([
    data.ingredients.length > 0 &&
    supabase.from("recipe_ingredients").insert(
      data.ingredients.map((ing) => ({ ...ing, recipe_id: id }))
    ),
    data.instructions.length > 0 &&
    supabase.from("recipe_instructions").insert(
      data.instructions.map((ins) => ({ ...ins, recipe_id: id }))
    ),
    data.tag_ids.length > 0 &&
    supabase.from("recipe_tags").insert(
      data.tag_ids.map((tag_id) => ({ recipe_id: id, tag_id }))
    ),
  ]);
}

export async function deleteRecipe(id: string, userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getTags() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data as { id: string; name: string }[];
}

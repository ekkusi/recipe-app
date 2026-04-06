import { createServiceClient } from "@/lib/supabase/server";
import type { Collection, CollectionWithRecipes } from "@recipe-app/shared";

export async function getCollections(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .select(`id, user_id, name, created_at, collection_recipes ( recipe_id )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (Collection & { collection_recipes: { recipe_id: string }[] })[];
}

export async function getCollection(id: string, userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .select(`
      id, user_id, name, created_at,
      collection_recipes (
        added_at,
        recipes ( id, title, description, difficulty, time_minutes, is_private )
      )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as CollectionWithRecipes & {
    collection_recipes: { added_at: string; recipes: CollectionWithRecipes['recipes'][number] }[];
  };
}

export async function createCollection(userId: string, name: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteCollection(id: string, userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addRecipeToCollection(collectionId: string, recipeId: string, userId: string) {
  const supabase = createServiceClient();
  // Verify ownership
  const { data: col } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();
  if (!col) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const { error } = await supabase
    .from("collection_recipes")
    .insert({ collection_id: collectionId, recipe_id: recipeId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeRecipeFromCollection(collectionId: string, recipeId: string, userId: string) {
  const supabase = createServiceClient();
  const { data: col } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();
  if (!col) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const { error } = await supabase
    .from("collection_recipes")
    .delete()
    .eq("collection_id", collectionId)
    .eq("recipe_id", recipeId);
  if (error) throw error;
}

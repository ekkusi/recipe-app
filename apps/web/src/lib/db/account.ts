import { createServiceClient } from "@/lib/supabase/server";

export async function deleteAllUserData(userId: string) {
  const supabase = createServiceClient();

  // Recipes (cascades to ingredients, instructions, tags)
  await supabase.from("recipes").delete().eq("user_id", userId);

  // Collections (cascades to collection_recipes)
  await supabase.from("collections").delete().eq("user_id", userId);

  // Shopping list memberships
  await supabase.from("shopping_list_members").delete().eq("user_id", userId);

  // Shopping lists owned by user (cascades to items)
  await supabase.from("shopping_lists").delete().eq("owner_id", userId);

  // Fallback: orphan shopping list items
  await supabase.from("shopping_list_items").delete().eq("user_id", userId);
}

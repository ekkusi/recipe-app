import { createServiceClient } from "@/lib/supabase/server";

import type { ShoppingItem, ShoppingItemInput } from "@recipe-app/shared";

export async function getShoppingList(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", userId)
    .order("checked", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ShoppingItem[];
}

export async function addShoppingItem(
  userId: string,
  item: ShoppingItemInput
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({ ...item, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as ShoppingItem;
}

export async function addShoppingItems(
  userId: string,
  items: ShoppingItemInput[]
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_list_items")
    .insert(items.map((item) => ({ ...item, user_id: userId })));
  if (error) throw error;
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function clearCheckedItems(userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", userId)
    .eq("checked", true);
  if (error) throw error;
}

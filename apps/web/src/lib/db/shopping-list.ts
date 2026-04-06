import { createServiceClient } from "@/lib/supabase/server";
import type { ShoppingItem, ShoppingItemInput, ShoppingList } from "@recipe-app/shared";

type SupabaseClient = ReturnType<typeof createServiceClient>;

async function assertMember(supabase: SupabaseClient, listId: string, userId: string) {
  const { data } = await supabase
    .from("shopping_list_members")
    .select("user_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .single();
  if (!data) throw Object.assign(new Error("Forbidden"), { status: 403 });
}

type ListRow = {
  id: string;
  name: string;
  owner_id: string;
  invite_token: string;
  created_at: string;
  shopping_list_members?: unknown[];
};

function rowToList(l: ListRow): ShoppingList {
  return {
    id: l.id,
    name: l.name,
    owner_id: l.owner_id,
    invite_token: l.invite_token,
    created_at: l.created_at,
    member_count: l.shopping_list_members?.length ?? 0,
  };
}

export async function getLists(userId: string): Promise<ShoppingList[]> {
  const supabase = createServiceClient();
  const { data: memberRows } = await supabase
    .from("shopping_list_members")
    .select("list_id")
    .eq("user_id", userId);

  const listIds = (memberRows ?? []).map((m: { list_id: string }) => m.list_id);
  if (listIds.length === 0) return [];

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, name, owner_id, invite_token, created_at, shopping_list_members(user_id)")
    .in("id", listIds)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as ListRow[]).map(rowToList);
}

export async function getOrCreateDefaultList(userId: string): Promise<ShoppingList> {
  const lists = await getLists(userId);
  if (lists.length > 0) return lists[0];
  return createShoppingList(userId, "Oma");
}

export async function createShoppingList(userId: string, name: string): Promise<ShoppingList> {
  const supabase = createServiceClient();
  const { data: list, error } = await supabase
    .from("shopping_lists")
    .insert({ name, owner_id: userId })
    .select("id, name, owner_id, invite_token, created_at")
    .single();
  if (error) throw error;

  await supabase
    .from("shopping_list_members")
    .insert({ list_id: list.id, user_id: userId });

  return { ...(list as ListRow), member_count: 1 };
}

export async function renameShoppingList(listId: string, userId: string, name: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ name })
    .eq("id", listId)
    .eq("owner_id", userId);
  if (error) throw error;
}

export async function deleteShoppingList(listId: string, userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("owner_id", userId);
  if (error) throw error;
}

export async function getListItems(listId: string, userId: string): Promise<ShoppingItem[]> {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("list_id", listId)
    .order("checked", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ShoppingItem[];
}

export async function addShoppingItem(
  listId: string,
  userId: string,
  item: ShoppingItemInput
): Promise<ShoppingItem> {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({ list_id: listId, added_by: userId, ...item })
    .select()
    .single();
  if (error) throw error;
  return data as ShoppingItem;
}

export async function addShoppingItems(
  listId: string,
  userId: string,
  items: ShoppingItemInput[]
) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { error } = await supabase
    .from("shopping_list_items")
    .insert(items.map((item) => ({ list_id: listId, added_by: userId, ...item })));
  if (error) throw error;
}

export async function toggleShoppingItem(id: string, checked: boolean, listId: string, userId: string) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", id)
    .eq("list_id", listId);
  if (error) throw error;
}

export async function updateShoppingItem(
  id: string,
  data: { name?: string; quantity?: string | null; unit?: string | null },
  listId: string,
  userId: string,
) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { error } = await supabase
    .from("shopping_list_items")
    .update(data)
    .eq("id", id)
    .eq("list_id", listId);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string, listId: string, userId: string) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id)
    .eq("list_id", listId);
  if (error) throw error;
}

export async function clearCheckedItems(listId: string, userId: string) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("checked", true);
  if (error) throw error;
}

export async function joinShoppingList(token: string, userId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("invite_token", token)
    .single();
  if (!list) throw Object.assign(new Error("Invalid invite token"), { status: 404 });

  const { error } = await supabase
    .from("shopping_list_members")
    .insert({ list_id: list.id, user_id: userId });
  if (error && error.code !== "23505") throw error;

  return list.id as string;
}

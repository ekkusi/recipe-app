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
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as ShoppingItem[];
}

function mergeQuantity(existing: string | null, incoming: string | null): string | null {
  if (incoming === null || incoming === "") return existing;
  if (existing === null || existing === "") return incoming;
  const a = parseFloat(existing);
  const b = parseFloat(incoming);
  if (isFinite(a) && isFinite(b)) {
    const sum = a + b;
    return Number.isInteger(sum) ? sum.toString() : sum.toString();
  }
  return `${existing} + ${incoming}`;
}

export async function addShoppingItem(
  listId: string,
  userId: string,
  item: ShoppingItemInput
): Promise<ShoppingItem> {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);

  // Check for existing unchecked item with same name+unit to merge quantity
  let existingQuery = supabase
    .from("shopping_list_items")
    .select("*")
    .eq("list_id", listId)
    .eq("checked", false)
    .ilike("name", item.name);

  if (item.unit) {
    existingQuery = existingQuery.eq("unit", item.unit);
  } else {
    existingQuery = existingQuery.is("unit", null);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const newQty = mergeQuantity(existing.quantity, item.quantity);
    const { data, error } = await supabase
      .from("shopping_list_items")
      .update({ quantity: newQty })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as ShoppingItem;
  }

  // Get next sort_order for new item
  const { data: maxRow } = await supabase
    .from("shopping_list_items")
    .select("sort_order")
    .eq("list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow?.sort_order ?? -1) as number) + 1;

  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({ list_id: listId, added_by: userId, sort_order: nextOrder, ...item })
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
  // Process sequentially so each merge sees the updated state of previous insertions
  for (const item of items) {
    await addShoppingItem(listId, userId, item);
  }
}

export async function reorderShoppingItems(
  listId: string,
  userId: string,
  orderedIds: string[]
) {
  const supabase = createServiceClient();
  await assertMember(supabase, listId, userId);
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("shopping_list_items")
        .update({ sort_order: idx })
        .eq("id", id)
        .eq("list_id", listId)
    )
  );
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

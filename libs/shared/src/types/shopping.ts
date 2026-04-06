export type ShoppingList = {
  id: string;
  name: string;
  owner_id: string;
  invite_token: string;
  created_at: string;
  member_count?: number;
};

export type ShoppingItem = {
  id: string;
  list_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  added_by: string;
  created_at: string;
};

export type ShoppingItemInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

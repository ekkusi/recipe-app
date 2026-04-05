export type ShoppingItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
};

export type ShoppingItemInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

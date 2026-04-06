export type Difficulty = "easy" | "medium" | "hard";

export type Ingredient = {
  id?: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
};

export type Instruction = {
  id?: string;
  step_number: number;
  content: string;
};

export type Tag = { id: string; name: string };

export type RecipeFormData = {
  title: string;
  description: string;
  difficulty: Difficulty | null;
  time_minutes: number | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  tag_ids: string[];
  is_private: boolean;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  difficulty: Difficulty | null;
  time_minutes: number | null;
  is_private: boolean;
  created_at: string;
  recipe_ingredients: Ingredient[];
  recipe_instructions: Instruction[];
  recipe_tags: { tag_id: string; tags: Tag }[];
};

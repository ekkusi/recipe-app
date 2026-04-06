import type { Recipe } from './recipes';

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type CollectionWithRecipes = Collection & {
  recipes: Pick<Recipe, 'id' | 'title' | 'description' | 'difficulty' | 'time_minutes'>[];
};

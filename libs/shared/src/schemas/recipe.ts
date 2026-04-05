import { z } from 'zod';

export const ingredientRowSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.string(),
  unit: z.string(),
});

export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  time_minutes: z.string(),
  ingredients: z.array(ingredientRowSchema).min(1, 'Add at least one ingredient'),
  instructions: z.array(
    z.object({ content: z.string().min(1, 'Step content is required') })
  ).min(1, 'Add at least one step'),
  tag_ids: z.array(z.string()),
});

export type RecipeFormSchema = z.infer<typeof recipeFormSchema>;
export type IngredientRowSchema = z.infer<typeof ingredientRowSchema>;

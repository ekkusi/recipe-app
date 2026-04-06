import { z } from 'zod';

export const ingredientRowSchema = z.object({
  name: z.string().min(1, 'Kenttä on pakollinen'),
  quantity: z.string(),
  unit: z.string(),
});

export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Kenttä on pakollinen'),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  time_minutes: z.string(),
  ingredients: z.array(ingredientRowSchema).min(1, 'Lisää vähintään 1 ainesosa'),
  instructions: z.array(
    z.object({ content: z.string().min(1, 'Kenttä on pakollinen') })
  ).min(1, 'Lisää vähintään 1 vaihe'),
  tag_ids: z.array(z.string()),
  is_private: z.boolean(),
});

export type RecipeFormSchema = z.infer<typeof recipeFormSchema>;
export type IngredientRowSchema = z.infer<typeof ingredientRowSchema>;

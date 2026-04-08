import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Recipe, Tag } from '@recipe-app/shared';
import type { RecipeFormSchema } from '@recipe-app/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../../lib/api';
import { RecipeForm } from '../../../../components/recipes/RecipeForm';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiFetch<Recipe>(`/api/recipes/${id}`, getToken),
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiFetch<Tag[]>('/api/tags', getToken),
  });

  const updateMutation = useMutation({
    mutationFn: (values: RecipeFormSchema) =>
      apiFetch(`/api/recipes/${id}`, getToken, {
        method: 'PUT',
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipes'] }),
        queryClient.invalidateQueries({ queryKey: ['recipe', id] }),
      ]);
      router.back();
    },
  });

  if (recipeLoading || tagsLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-destructive">{t('recipes.notFound')}</Text>
      </View>
    );
  }

  const ingredients = [...(recipe.recipe_ingredients ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const instructions = [...(recipe.recipe_instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number
  );

  const initialValues: Partial<RecipeFormSchema> = {
    title: recipe.title,
    description: recipe.description ?? '',
    difficulty: recipe.difficulty ?? null,
    time_minutes: recipe.time_minutes?.toString() ?? '',
    ingredients: ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? '',
      unit: ing.unit ?? '',
      is_section_header: ing.is_section_header ?? false,
    })),
    instructions: instructions.map((ins) => ({ content: ins.content })),
    tag_ids: recipe.recipe_tags?.map((rt) => rt.tag_id) ?? [],
    is_private: recipe.is_private ?? false,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
    >
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">{t('recipes.editRecipe')}</Text>
      </View>
      <RecipeForm
        initialValues={initialValues}
        tags={tags}
        onSubmit={(values) => {
          updateMutation.mutateAsync(values)
        }}
        submitLabel={t('recipes.saveChanges')}
        onCancel={() => router.back()}
      />
    </KeyboardAvoidingView>
  );
}

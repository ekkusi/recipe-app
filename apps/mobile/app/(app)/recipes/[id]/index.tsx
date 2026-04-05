import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Recipe } from '@recipe-app/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { apiFetch } from '../../../../lib/api';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiFetch<Recipe>(`/api/recipes/${id}`, getToken),
  });

  const addToShoppingMutation = useMutation({
    mutationFn: (ingredients: { name: string; quantity: number | null; unit: string | null }[]) =>
      apiFetch('/api/shopping-list/bulk', getToken, {
        method: 'POST',
        body: JSON.stringify({ ingredients }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-destructive">{t('recipes.loadOneError')}</Text>
      </View>
    );
  }

  const tags = recipe.recipe_tags?.map((rt) => rt.tags) ?? [];
  const ingredients = [...(recipe.recipe_ingredients ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const instructions = [...(recipe.recipe_instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number
  );

  function handleAddToShoppingList() {
    addToShoppingMutation.mutate(
      ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      }))
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-75">
          <Text className="text-primary text-base font-semibold">{t('common.back')}</Text>
        </Pressable>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/recipes/${id}/edit`)}
          className="bg-muted border border-border rounded-xl px-3 py-1.5 active:opacity-75"
        >
          <Text className="text-foreground text-sm font-semibold">{t('common.edit')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Title */}
        <Text className="text-2xl font-bold text-foreground mb-3">{recipe.title}</Text>

        {/* Meta badges */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {recipe.difficulty && (
            <View className="bg-muted rounded-full px-3 py-1">
              <Text className="text-xs text-muted-foreground">
                {t(`recipes.difficulty_${recipe.difficulty}`)}
              </Text>
            </View>
          )}
          {recipe.time_minutes && (
            <View className="bg-muted rounded-full px-3 py-1">
              <Text className="text-xs text-muted-foreground">
                {t('recipes.timeMinutes', { time: recipe.time_minutes })}
              </Text>
            </View>
          )}
          {tags.map((tag) => (
            <View key={tag.id} className="bg-muted rounded-full px-3 py-1">
              <Text className="text-xs text-muted-foreground capitalize">{tag.name}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {recipe.description && (
          <Text className="text-muted-foreground leading-relaxed mb-6">{recipe.description}</Text>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">{t('recipes.ingredients')}</Text>
              <TouchableOpacity
                onPress={handleAddToShoppingList}
                disabled={addToShoppingMutation.isPending}
                className="bg-secondary rounded-xl px-3 py-1.5 active:opacity-75"
                style={{ opacity: addToShoppingMutation.isPending ? 0.5 : 1 }}
              >
                <Text className="text-sm font-semibold text-foreground">
                  {addToShoppingMutation.isPending ? t('recipes.adding') : t('recipes.addToShopping')}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="bg-card border border-border rounded-2xl overflow-hidden">
              {ingredients.map((ing, i) => (
                <View
                  key={ing.id ?? i}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    i < ingredients.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Text className="font-medium text-foreground">{ing.name}</Text>
                  {(ing.quantity != null || ing.unit) && (
                    <Text className="text-sm text-muted-foreground">
                      {[ing.quantity?.toString(), ing.unit].filter(Boolean).join(' ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">{t('recipes.instructions')}</Text>
            <View className="gap-4">
              {instructions.map((ins) => (
                <View key={ins.id ?? ins.step_number} className="flex-row gap-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center shrink-0 mt-0.5">
                    <Text className="text-primary font-bold text-sm">{ins.step_number}</Text>
                  </View>
                  <Text className="flex-1 text-foreground leading-relaxed pt-1">
                    {ins.content}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

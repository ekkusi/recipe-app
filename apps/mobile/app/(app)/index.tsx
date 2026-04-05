import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import type { Recipe } from '@recipe-app/shared';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

import { apiFetch } from '../../lib/api';

export default function RecipesScreen() {
  const { getToken } = useAuth();

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiFetch<Recipe[]>('/api/recipes', getToken),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading recipes…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-destructive">Failed to load recipes</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-2xl font-bold text-foreground">Recipes</Text>
      </View>

      <FlashList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <Text className="text-center text-muted-foreground mt-8">No recipes yet</Text>
        }
        renderItem={({ item }) => (
          <View className="bg-card border border-border rounded-2xl p-4">
            <Text className="text-base font-semibold text-foreground">{item.title}</Text>
            {item.description ? (
              <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

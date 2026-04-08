import { useAuth } from '@clerk/expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../lib/api';

type Recipe = { id: string; title: string; difficulty: string | null; time_minutes: number | null };
type CollectionData = { name: string; collection_recipes: { recipes: Recipe }[] };

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => apiFetch<CollectionData>(`/api/collections/${id}`, getToken),
  });

  const removeMutation = useMutation({
    mutationFn: (recipeId: string) =>
      apiFetch(`/api/collections/${id}/recipes/${recipeId}`, getToken, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection', id] }),
  });

  const recipes = data?.collection_recipes.map((cr) => cr.recipes) ?? [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}>
      <View className="px-4 pb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-75">
          <Text className="text-primary font-semibold">{t('common.back')}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1" numberOfLines={1}>
          {data?.name ?? t('common.loading')}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center">{t('collections.empty_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/recipes/${item.id}`)}
              className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center justify-between active:opacity-75"
            >
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.title}</Text>
                {(item.difficulty || item.time_minutes) && (
                  <Text className="text-sm text-muted-foreground mt-0.5">
                    {[item.difficulty && t(`recipes.difficulty_${item.difficulty}`), item.time_minutes && `${item.time_minutes} min`].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => removeMutation.mutate(item.id)} hitSlop={8}>
                <Text className="text-muted-foreground text-xl px-1">×</Text>
              </TouchableOpacity>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

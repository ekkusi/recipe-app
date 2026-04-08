import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import type { Recipe } from '@recipe-app/shared';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '../../../lib/api';

export default function RecipesScreen() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiFetch<Recipe[]>('/api/recipes', getToken),
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-4 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">{t('recipes.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/recipes/new')}
          className="bg-primary rounded-xl px-3 py-1.5"
        >
          <Text className="text-primary-foreground font-semibold text-sm">{t('recipes.new')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">{t('recipes.loadError')}</Text>
        </View>
      ) : (
        <FlashList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-4xl mb-3">🍳</Text>
              <Text className="font-semibold text-foreground">{t('recipes.empty_title')}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{t('recipes.empty_subtitle')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/recipes/${item.id}`)}
              className="bg-card border border-border rounded-2xl p-4 active:opacity-75"
            >
              <Text className="text-base font-semibold text-foreground">{item.title}</Text>
              {item.description ? (
                <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {item.difficulty ? (
                  <View className="bg-muted rounded-full px-2 py-0.5">
                    <Text className="text-xs text-muted-foreground capitalize">
                      {t(`recipes.difficulty_${item.difficulty}`)}
                    </Text>
                  </View>
                ) : null}
                {item.time_minutes ? (
                  <View className="bg-muted rounded-full px-2 py-0.5">
                    <Text className="text-xs text-muted-foreground">
                      {t('recipes.timeMinutes', { time: item.time_minutes })}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

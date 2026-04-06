import { useAuth } from '@clerk/expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { apiFetch } from '../../../lib/api';

type Collection = { id: string; name: string; collection_recipes: { recipe_id: string }[] };

export default function CollectionsScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => apiFetch<Collection[]>('/api/collections', getToken),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch('/api/collections', getToken, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNewName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/collections/${id}`, getToken, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  });

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-2">
        <Text className="text-2xl font-bold text-foreground mb-4">{t('collections.title')}</Text>
        <View className="flex-row gap-2 mb-4">
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={t('collections.name')}
            placeholderTextColor="#8a7a68"
            className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground"
            onSubmitEditing={() => newName.trim() && createMutation.mutate(newName.trim())}
          />
          <TouchableOpacity
            onPress={() => newName.trim() && createMutation.mutate(newName.trim())}
            disabled={!newName.trim() || createMutation.isPending}
            className="bg-primary rounded-xl px-4 items-center justify-center active:opacity-75"
          >
            <Text className="text-primary-foreground font-bold text-lg">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      ) : collections.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="text-lg font-semibold text-foreground">{t('collections.empty_title')}</Text>
          <Text className="text-muted-foreground text-center">{t('collections.empty_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/collections/${item.id}`)}
              className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center justify-between active:opacity-75"
            >
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {t('collections.recipeCount', { count: item.collection_recipes?.length ?? 0 })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteMutation.mutate(item.id)} hitSlop={8}>
                <Text className="text-muted-foreground text-xl px-1">×</Text>
              </TouchableOpacity>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

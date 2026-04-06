import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Recipe } from '@recipe-app/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiFetch } from '../../../../lib/api';
import { getActiveListId } from '../../../../lib/active-shopping-list';

type CollectionRow = { id: string; name: string; collection_recipes: { recipe_id: string }[] };

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [newCollectionName, setNewCollectionName] = useState('');
  const [shoppingAdded, setShoppingAdded] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedIngredientIndices, setSelectedIngredientIndices] = useState<Set<number>>(new Set());

  const { data: recipe, isLoading, error, refetch } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiFetch<Recipe>(`/api/recipes/${id}`, getToken),
  });

  const isOwner = recipe ? recipe.user_id === userId : false;

  async function openCollections() {
    const data = await apiFetch<CollectionRow[]>('/api/collections', getToken);
    setCollections(data);
    setSelectedCollectionIds(
      new Set(data.filter((c) => c.collection_recipes.some((cr) => cr.recipe_id === id)).map((c) => c.id))
    );
    setCollectionsOpen(true);
  }

  async function toggleCollection(collectionId: string) {
    const isSelected = selectedCollectionIds.has(collectionId);
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      isSelected ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
    if (isSelected) {
      await apiFetch(`/api/collections/${collectionId}/recipes/${id}`, getToken, { method: 'DELETE' });
    } else {
      await apiFetch(`/api/collections/${collectionId}/recipes`, getToken, {
        method: 'POST',
        body: JSON.stringify({ recipeId: id }),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
  }

  async function createAndAddCollection() {
    if (!newCollectionName.trim()) return;
    const { id: colId } = await apiFetch<{ id: string }>('/api/collections', getToken, {
      method: 'POST',
      body: JSON.stringify({ name: newCollectionName.trim() }),
    });
    const newCol: CollectionRow = { id: colId, name: newCollectionName.trim(), collection_recipes: [] };
    setCollections((prev) => [...prev, newCol]);
    setNewCollectionName('');
    await toggleCollection(colId);
  }

  async function handleShare() {
    const appUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
    await Share.share({ url: `${appUrl}/r/${id}`, message: recipe?.title ?? '' });
  }

  async function handleCopy() {
    const { id: newId } = await apiFetch<{ id: string }>(`/api/recipes/${id}/copy`, getToken, { method: 'POST' });
    router.replace(`/(app)/recipes/${newId}`);
  }

  const addToShoppingMutation = useMutation({
    mutationFn: async (ingredients: { name: string; quantity: string | null; unit: string | null }[]) => {
      const listId = await getActiveListId();
      return apiFetch('/api/shopping-list/bulk', getToken, {
        method: 'POST',
        body: JSON.stringify({ ingredients, listId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      setShoppingAdded(true);
      setTimeout(() => setShoppingAdded(false), 2000);
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

  const nonHeaderIngredients = ingredients.filter((ing) => !ing.is_section_header);

  function openBulkModal() {
    setSelectedIngredientIndices(new Set(nonHeaderIngredients.map((_, i) => i)));
    setBulkModalOpen(true);
  }

  function toggleIngredientSelection(i: number) {
    setSelectedIngredientIndices((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function confirmBulkAdd() {
    const selected = nonHeaderIngredients
      .filter((_, i) => selectedIngredientIndices.has(i))
      .map((ing) => ({ name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null }));
    addToShoppingMutation.mutate(selected);
    setBulkModalOpen(false);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-75">
          <Ionicons name="chevron-back" size={28} color="#b06060" />
        </Pressable>
        <View className="flex-row gap-1">
          {isOwner && (
            <>
              <TouchableOpacity
                onPress={handleShare}
                hitSlop={8}
                className="p-2 active:opacity-75"
              >
                <MaterialCommunityIcons name="share-variant-outline" size={22} color="#5c4f44" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openCollections}
                hitSlop={8}
                className="p-2 active:opacity-75"
              >
                <Ionicons name="folder-outline" size={22} color="#5c4f44" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/(app)/recipes/${id}/edit`)}
                hitSlop={8}
                className="p-2 active:opacity-75"
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color="#5c4f44" />
              </TouchableOpacity>
            </>
          )}
          {!isOwner && (
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={8}
              className="p-2 active:opacity-75"
            >
              <Ionicons name="copy-outline" size={22} color="#5c4f44" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Title */}
        <Text className="text-2xl font-bold text-foreground mb-3">{recipe.title}</Text>

        {/* Meta badges */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {recipe.is_private && (
            <View className="bg-muted rounded-full px-3 py-1 flex-row items-center gap-1">
              <Ionicons name="lock-closed-outline" size={11} color="#8a7a68" />
              <Text className="text-xs text-muted-foreground">{t('privacy.private')}</Text>
            </View>
          )}
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
                onPress={openBulkModal}
                disabled={addToShoppingMutation.isPending || shoppingAdded || nonHeaderIngredients.length === 0}
                className="flex-row items-center gap-1.5 border border-border rounded-xl px-3 py-1.5 active:opacity-75"
                style={{ opacity: addToShoppingMutation.isPending ? 0.5 : 1 }}
              >
                <Ionicons
                  name={shoppingAdded ? 'checkmark' : 'cart-outline'}
                  size={14}
                  color={shoppingAdded ? '#22c55e' : '#5c4f44'}
                />
                <Text className={`text-sm font-semibold ${shoppingAdded ? 'text-green-500' : 'text-foreground'}`}>
                  {addToShoppingMutation.isPending
                    ? t('recipes.adding')
                    : shoppingAdded
                      ? t('recipes.added')
                      : t('recipes.addToShopping')}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="bg-card border border-border rounded-2xl overflow-hidden">
              {ingredients.map((ing, i) => {
                if (ing.is_section_header) {
                  return (
                    <View
                      key={ing.id ?? i}
                      className={`px-4 py-2 bg-muted/40 ${i < ingredients.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <Text className="text-sm font-bold text-foreground">{ing.name}</Text>
                    </View>
                  );
                }
                return (
                  <View
                    key={ing.id ?? i}
                    className={`flex-row items-center justify-between px-4 py-3 ${i < ingredients.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <Text className="font-medium text-foreground flex-1">{ing.name}</Text>
                    {(ing.quantity != null || ing.unit) && (
                      <Text className="text-sm text-muted-foreground mr-2">
                        {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => addToShoppingMutation.mutate([{ name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null }])}
                      hitSlop={8}
                      className="active:opacity-75"
                    >
                      <Ionicons name="cart-outline" size={18} color="#8a7a68" />
                    </TouchableOpacity>
                  </View>
                );
              })}
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

      {/* Bulk add modal */}
      <Modal
        visible={bulkModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBulkModalOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setBulkModalOpen(false)}
        >
          <Pressable>
            <View className="bg-background rounded-t-3xl p-6 pb-10">
              <Text className="font-bold text-lg mb-4 text-foreground">
                {t('recipes.selectIngredients')}
              </Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {nonHeaderIngredients.map((ing, i) => {
                  const selected = selectedIngredientIndices.has(i);
                  return (
                    <TouchableOpacity
                      key={ing.id ?? i}
                      onPress={() => toggleIngredientSelection(i)}
                      className="flex-row items-center justify-between py-3 border-b border-border"
                    >
                      <Text className="flex-1 text-base text-foreground">{ing.name}</Text>
                      {(ing.quantity != null || ing.unit) && (
                        <Text className="text-sm text-muted-foreground mr-3">
                          {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                        </Text>
                      )}
                      <View
                        className={`w-5 h-5 rounded border-2 items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'}`}
                      >
                        {selected && <Text className="text-white text-xs font-bold">✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                onPress={confirmBulkAdd}
                disabled={selectedIngredientIndices.size === 0}
                className="mt-4 bg-primary rounded-2xl py-4 items-center active:opacity-75"
                style={{ opacity: selectedIngredientIndices.size === 0 ? 0.5 : 1 }}
              >
                <Text className="text-primary-foreground font-semibold">
                  {t('recipes.addSelected')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Collections bottom sheet */}
      <Modal
        visible={collectionsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCollectionsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setCollectionsOpen(false)}
        >
          <Pressable>
            <View className="bg-background rounded-t-3xl p-6 pb-10">
              <Text className="font-bold text-lg mb-4 text-foreground">
                {t('collections.addToCollection')}
              </Text>
              <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                {collections.length === 0 && (
                  <Text className="text-muted-foreground text-sm mb-2">
                    {t('collections.empty_title')}
                  </Text>
                )}
                {collections.map((col) => {
                  const selected = selectedCollectionIds.has(col.id);
                  return (
                    <TouchableOpacity
                      key={col.id}
                      onPress={() => toggleCollection(col.id)}
                      className="flex-row items-center justify-between py-3 border-b border-border"
                    >
                      <Text className="text-base text-foreground">{col.name}</Text>
                      <View
                        className={`w-5 h-5 rounded border-2 items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'
                          }`}
                      >
                        {selected && <Text className="text-white text-xs font-bold">✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* New collection input */}
              <View className="flex-row gap-2 mt-4">
                <TextInput
                  className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder={t('collections.name')}
                  placeholderTextColor="#8a7a68"
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  onSubmitEditing={createAndAddCollection}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={createAndAddCollection}
                  disabled={!newCollectionName.trim()}
                  className="bg-primary rounded-xl w-12 items-center justify-center"
                  style={{ opacity: !newCollectionName.trim() ? 0.5 : 1 }}
                >
                  <Text className="text-primary-foreground text-xl font-bold">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

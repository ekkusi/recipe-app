import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShoppingItem } from '@recipe-app/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { apiFetch } from '../../../lib/api';
import { UnitPicker } from '../../../components/ui/UnitPicker';

export default function ShoppingListScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: () => apiFetch<ShoppingItem[]>('/api/shopping-list', getToken),
  });

  const addMutation = useMutation({
    mutationFn: (data: { name: string; quantity: number | null; unit: string | null }) =>
      apiFetch<ShoppingItem>('/api/shopping-list', getToken, {
        method: 'POST',
        body: JSON.stringify({ name: data.name, quantity: data.quantity, unit: data.unit }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      setName('');
      setQuantity('');
      setUnit('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      apiFetch(`/api/shopping-list/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ checked }),
      }),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list'] });
      const prev = queryClient.getQueryData(['shopping-list']);
      queryClient.setQueryData(['shopping-list'], (old: ShoppingItem[]) =>
        old.map((item) => (item.id === id ? { ...item, checked } : item))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list'], ctx?.prev);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/shopping-list/${id}`, getToken, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list'] });
      const prev = queryClient.getQueryData(['shopping-list']);
      queryClient.setQueryData(['shopping-list'], (old: ShoppingItem[]) =>
        old.filter((item) => item.id !== id)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list'], ctx?.prev);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/shopping-list/clear-checked', getToken, { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list'] });
      const prev = queryClient.getQueryData(['shopping-list']);
      queryClient.setQueryData(['shopping-list'], (old: ShoppingItem[]) =>
        old.filter((item) => !item.checked)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list'], ctx?.prev);
    },
  });

  function handleAdd() {
    if (!name.trim()) return;
    addMutation.mutate({
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || null,
    });
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="px-4 pt-14 pb-4">
        <Text className="text-2xl font-bold text-foreground">{t('shopping.title')}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add item form */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 gap-3">
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder={t('shopping.addPlaceholder')}
              placeholderTextColor="#8a7a68"
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!name.trim() || addMutation.isPending}
              className="bg-primary rounded-xl w-12 items-center justify-center"
              style={{ opacity: !name.trim() || addMutation.isPending ? 0.5 : 1 }}
            >
              <Text className="text-primary-foreground text-xl font-bold">+</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder={t('shopping.qtyPlaceholder')}
              placeholderTextColor="#8a7a68"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            <View className="w-24">
              <UnitPicker value={unit} onChange={setUnit} />
            </View>
          </View>
        </View>

        {isLoading ? (
          <Text className="text-center text-muted-foreground mt-8">{t('common.loading')}</Text>
        ) : error ? (
          <Text className="text-center text-destructive mt-8">{t('shopping.loadError')}</Text>
        ) : items.length === 0 ? (
          <View className="items-center pt-12">
            <Text className="text-4xl mb-3">🛒</Text>
            <Text className="font-semibold text-foreground">{t('shopping.empty_title')}</Text>
            <Text className="text-sm text-muted-foreground mt-1">{t('shopping.empty_subtitle')}</Text>
          </View>
        ) : (
          <>
            {/* Unchecked */}
            {unchecked.length > 0 && (
              <View className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
                {unchecked.map((item, i) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    showDivider={i < unchecked.length - 1}
                    onToggle={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Checked */}
            {checked.length > 0 && (
              <View>
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <Text className="text-sm font-semibold text-muted-foreground">
                    {t('shopping.done', { count: checked.length })}
                  </Text>
                  <TouchableOpacity onPress={() => clearMutation.mutate()}>
                    <Text className="text-xs text-muted-foreground underline">{t('shopping.clearAll')}</Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-card border border-border rounded-2xl overflow-hidden opacity-70">
                  {checked.map((item, i) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      showDivider={i < checked.length - 1}
                      onToggle={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                      onDelete={() => deleteMutation.mutate(item.id)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ShoppingItemRow({
  item,
  showDivider,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  showDivider: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View className={`${showDivider ? 'border-b border-border' : ''}`}>
      <Pressable
        onPress={onToggle}
        className="flex-row items-center px-4 py-3 gap-3 active:opacity-75"
      >
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
            item.checked ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {item.checked && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
        <Text
          className={`flex-1 text-base text-foreground ${item.checked ? 'line-through' : ''}`}
        >
          {item.name}
        </Text>
        {(item.quantity != null || item.unit) && (
          <Text className="text-sm text-muted-foreground">
            {[item.quantity?.toString(), item.unit].filter(Boolean).join(' ')}
          </Text>
        )}
        <TouchableOpacity onPress={onDelete} hitSlop={8}>
          <Text className="text-muted-foreground text-lg px-1">×</Text>
        </TouchableOpacity>
      </Pressable>
    </View>
  );
}

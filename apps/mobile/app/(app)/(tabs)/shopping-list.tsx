import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShoppingItem, ShoppingList } from '@recipe-app/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiFetch } from '../../../lib/api';
import { UnitPicker } from '../../../components/ui/UnitPicker';
import { supabase } from '../../../lib/supabase';
import { getActiveListId, setActiveListId as persistActiveListId } from '../../../lib/active-shopping-list';

export default function ShoppingListScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [activeListId, setActiveListIdState] = useState<string | null>(null);

  function setActiveListId(id: string) {
    setActiveListIdState(id);
    persistActiveListId(id);
  }
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renameName, setRenameName] = useState('');

  // Fetch lists
  const { data: lists = [] } = useQuery<ShoppingList[]>({
    queryKey: ['shopping-lists'],
    queryFn: () => apiFetch<ShoppingList[]>('/api/shopping-lists', getToken),
  });

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;
  const resolvedListId = activeList?.id ?? null;

  // Restore persisted active list on mount, fall back to first list
  useEffect(() => {
    if (lists.length === 0) return;
    getActiveListId().then((storedId) => {
      const match = storedId && lists.find((l) => l.id === storedId);
      if (match) {
        setActiveListIdState(storedId!);
      } else if (!activeListId) {
        setActiveListId(lists[0].id);
      }
    });
  }, [lists]);

  // Fetch items for active list
  const { data: items = [], isLoading, error } = useQuery<ShoppingItem[]>({
    queryKey: ['shopping-list-items', resolvedListId],
    queryFn: () => apiFetch<ShoppingItem[]>(`/api/shopping-lists/${resolvedListId}`, getToken),
    enabled: !!resolvedListId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!resolvedListId) return;
    const channel = supabase
      .channel(`list-${resolvedListId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `list_id=eq.${resolvedListId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shopping-list-items', resolvedListId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [resolvedListId]);

  const addMutation = useMutation({
    mutationFn: (data: { name: string; quantity: number | null; unit: string | null }) =>
      apiFetch<ShoppingItem>(`/api/shopping-lists/${resolvedListId}/items`, getToken, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      setName('');
      setQuantity('');
      setUnit('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      apiFetch(`/api/shopping-lists/${resolvedListId}/items/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ checked }),
      }),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      const prev = queryClient.getQueryData(['shopping-list-items', resolvedListId]);
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[]) =>
        old.map((item) => (item.id === id ? { ...item, checked } : item))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list-items', resolvedListId], ctx?.prev);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/shopping-lists/${resolvedListId}/items/${id}`, getToken, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      const prev = queryClient.getQueryData(['shopping-list-items', resolvedListId]);
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[]) =>
        old.filter((item) => item.id !== id)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list-items', resolvedListId], ctx?.prev);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/shopping-lists/${resolvedListId}/items/clear-checked`, getToken, { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      const prev = queryClient.getQueryData(['shopping-list-items', resolvedListId]);
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[]) =>
        old.filter((item) => !item.checked)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list-items', resolvedListId], ctx?.prev);
    },
  });

  const createListMutation = useMutation({
    mutationFn: (listName: string) =>
      apiFetch<ShoppingList>('/api/shopping-lists', getToken, {
        method: 'POST',
        body: JSON.stringify({ name: listName }),
      }),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setActiveListId(newList.id);
      setNewListOpen(false);
      setNewListName('');
    },
  });

  const renameListMutation = useMutation({
    mutationFn: (newName: string) =>
      apiFetch(`/api/shopping-lists/${resolvedListId}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setRenameOpen(false);
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/shopping-lists/${resolvedListId}`, getToken, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setActiveListIdState(null);
    },
  });

  function handleAdd() {
    if (!name.trim() || !resolvedListId) return;
    addMutation.mutate({
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || null,
    });
  }

  function handleMenuPress() {
    if (!activeList) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('common.cancel'),
            t('shopping.renameList'),
            t('shopping.invite'),
            t('shopping.deleteList'),
          ],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) { setRenameName(activeList.name); setRenameOpen(true); }
          else if (idx === 2) handleInvite();
          else if (idx === 3) handleDeleteList();
        }
      );
    } else {
      Alert.alert(activeList.name, undefined, [
        { text: t('shopping.renameList'), onPress: () => { setRenameName(activeList.name); setRenameOpen(true); } },
        { text: t('shopping.invite'), onPress: handleInvite },
        { text: t('shopping.deleteList'), style: 'destructive', onPress: handleDeleteList },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }

  async function handleInvite() {
    if (!resolvedListId) return;
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/shopping-lists/${resolvedListId}/invite`, getToken);
      if (Platform.OS === 'ios') {
        const { Share } = require('react-native');
        Share.share({ url });
      } else {
        Alert.alert('Kutsu', url);
      }
    } catch {
      Alert.alert(t('common.error'));
    }
  }

  function handleDeleteList() {
    Alert.alert(t('shopping.deleteList'), t('shopping.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('shopping.deleteList'), style: 'destructive', onPress: () => deleteListMutation.mutate() },
    ]);
  }

  function handleListSelect(listId: string) {
    if (listId === '__new__') {
      setNewListName('');
      setListPickerOpen(false);
      setNewListOpen(true);
      return;
    }
    setActiveListId(listId);
    setListPickerOpen(false);
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center gap-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center gap-1"
          onPress={() => setListPickerOpen(true)}
        >
          <Text className="text-2xl font-bold text-foreground">{activeList?.name ?? t('shopping.title')}</Text>
          <Text className="text-muted-foreground text-lg">▾</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenuPress} className="p-2">
          <Text className="text-2xl text-muted-foreground">⋯</Text>
        </TouchableOpacity>
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

      {/* List picker modal */}
      <Modal visible={listPickerOpen} transparent animationType="slide" onRequestClose={() => setListPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setListPickerOpen(false)}>
          <Pressable>
            <View className="bg-background rounded-t-3xl p-6">
              <Text className="font-bold text-lg mb-4 text-foreground">{t('shopping.selectList')}</Text>
              {lists.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => handleListSelect(l.id)}
                  className="py-3 border-b border-border"
                >
                  <Text className={`text-base ${l.id === resolvedListId ? 'text-primary font-semibold' : 'text-foreground'}`}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => handleListSelect('__new__')}
                className="py-3"
              >
                <Text className="text-primary font-semibold text-base">+ {t('shopping.newList')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* New list modal */}
      <Modal visible={newListOpen} transparent animationType="fade" onRequestClose={() => setNewListOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center p-4" onPress={() => setNewListOpen(false)}>
          <Pressable>
            <View className="bg-background rounded-3xl p-6 w-72">
              <Text className="font-bold text-lg mb-4 text-foreground">{t('shopping.newList')}</Text>
              <TextInput
                autoFocus
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground mb-3"
                placeholder={t('shopping.listNamePlaceholder')}
                placeholderTextColor="#8a7a68"
                value={newListName}
                onChangeText={setNewListName}
              />
              <TouchableOpacity
                onPress={() => { if (newListName.trim()) createListMutation.mutate(newListName.trim()); }}
                disabled={!newListName.trim() || createListMutation.isPending}
                className="bg-primary rounded-xl py-3 items-center"
                style={{ opacity: !newListName.trim() ? 0.5 : 1 }}
              >
                <Text className="text-primary-foreground font-semibold">{t('shopping.createList')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename modal */}
      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center p-4" onPress={() => setRenameOpen(false)}>
          <Pressable>
            <View className="bg-background rounded-3xl p-6 w-72">
              <Text className="font-bold text-lg mb-4 text-foreground">{t('shopping.renameList')}</Text>
              <TextInput
                autoFocus
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground mb-3"
                value={renameName}
                onChangeText={setRenameName}
              />
              <TouchableOpacity
                onPress={() => { if (renameName.trim()) renameListMutation.mutate(renameName.trim()); }}
                disabled={!renameName.trim() || renameListMutation.isPending}
                className="bg-primary rounded-xl py-3 items-center"
                style={{ opacity: !renameName.trim() ? 0.5 : 1 }}
              >
                <Text className="text-primary-foreground font-semibold">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${item.checked ? 'bg-primary border-primary' : 'border-border'
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

import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShoppingItem, ShoppingList } from '@recipe-app/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
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

import { apiFetch } from '../../../lib/api';
import { UnitPicker } from '../../../components/ui/UnitPicker';
import { supabase } from '../../../lib/supabase';
import { getActiveListId, setActiveListId as persistActiveListId } from '../../../lib/active-shopping-list';
import Sortable from 'react-native-sortables';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Realtime subscription — surgical in-place updates to preserve order
  useEffect(() => {
    if (!resolvedListId) return;
    const key = ['shopping-list-items', resolvedListId];
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
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(key, (old: ShoppingItem[] = []) =>
              old.map((item) =>
                item.id === payload.new.id ? { ...item, ...(payload.new as ShoppingItem) } : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(key, (old: ShoppingItem[] = []) =>
              old.filter((item) => item.id !== payload.old?.id)
            );
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(key, (old: ShoppingItem[] = []) => {
              // Already in cache (our own real item arrived)
              if (old.some((item) => item.id === payload.new.id)) return old;
              // Replace a temp item if we have one (subscription beat onSuccess)
              const tempIdx = old.findIndex((item) => item.id.startsWith('temp-'));
              if (tempIdx !== -1) {
                const next = [...old];
                next[tempIdx] = payload.new as ShoppingItem;
                return next;
              }
              // Item from another user — append
              return [...old, payload.new as ShoppingItem];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [resolvedListId]);

  const addMutation = useMutation({
    mutationFn: (data: { name: string; quantity: string | null; unit: string | null }) =>
      apiFetch<ShoppingItem>(`/api/shopping-lists/${resolvedListId}/items`, getToken, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ name: n, quantity: q, unit: u }) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      const prev = queryClient.getQueryData(['shopping-list-items', resolvedListId]);
      const tempId = `temp-${Date.now()}`;
      const tempItem: ShoppingItem = {
        id: tempId,
        list_id: resolvedListId!,
        name: n,
        quantity: q,
        unit: u,
        checked: false,
        added_by: '',
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[] = []) =>
        [...old, tempItem]
      );
      setName('');
      setQuantity('');
      setUnit('');
      return { prev, tempId };
    },
    onSuccess: (realItem, _, ctx) => {
      // Replace temp item with real item in-place (preserves position)
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[] = []) =>
        old.map((item) => (item.id === ctx?.tempId ? realItem : item))
      );
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list-items', resolvedListId], ctx?.prev);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, name: n }: { id: string; name: string }) =>
      apiFetch(`/api/shopping-lists/${resolvedListId}/items/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ name: n }),
      }),
    onMutate: async ({ id, name: n }) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list-items', resolvedListId] });
      const prev = queryClient.getQueryData(['shopping-list-items', resolvedListId]);
      queryClient.setQueryData(['shopping-list-items', resolvedListId], (old: ShoppingItem[]) =>
        old.map((item) => (item.id === id ? { ...item, name: n } : item))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['shopping-list-items', resolvedListId], ctx?.prev);
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

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiFetch(`/api/shopping-lists/${resolvedListId}/items`, getToken, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      }),
  });

  function handleAdd() {
    if (!name.trim() || !resolvedListId) return;
    addMutation.mutate({
      name: name.trim(),
      quantity: quantity || null,
      unit: unit || null,
    });
  }

  async function handleInvite() {
    if (!resolvedListId) return;
    setMenuOpen(false);
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/shopping-lists/${resolvedListId}/invite`, getToken);
      await Share.share({ url, message: url });
    } catch {
      Alert.alert(t('common.error'));
    }
  }

  function handleDeleteList() {
    setMenuOpen(false);
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
        {activeList && (
          <TouchableOpacity onPress={() => setMenuOpen(true)} className="p-2">
            <Text className="text-2xl text-muted-foreground">⋯</Text>
          </TouchableOpacity>
        )}
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
                <Sortable.Flex
                  customHandle
                  flexDirection="column"
                  width="fill"
                  gap={0}
                  onDragEnd={({ fromIndex, toIndex }) => {
                    if (fromIndex === toIndex) return;
                    const newUnchecked = [...unchecked];
                    const [moved] = newUnchecked.splice(fromIndex, 1);
                    newUnchecked.splice(toIndex, 0, moved);
                    queryClient.setQueryData(
                      ['shopping-list-items', resolvedListId],
                      [...newUnchecked, ...checked]
                    );
                    reorderMutation.mutate(newUnchecked.map((i) => i.id));
                  }}
                >
                  {unchecked.map((item, i) => (
                    <View key={item.id} style={{ width: Dimensions.get('window').width - 32 }}>
                      <ShoppingItemRow
                        item={item}
                        showDivider={i < unchecked.length - 1}
                        isEditing={editingItemId === item.id}
                        draggable
                        onToggle={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                        onLongPress={() => setEditingItemId(item.id)}
                        onBlurEdit={() => setEditingItemId(null)}
                        onDelete={() => deleteMutation.mutate(item.id)}
                        onUpdate={(n) => updateItemMutation.mutate({ id: item.id, name: n })}
                      />
                    </View>
                  ))}
                </Sortable.Flex>
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
                      isEditing={editingItemId === item.id}
                      onToggle={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                      onLongPress={() => setEditingItemId(item.id)}
                      onBlurEdit={() => setEditingItemId(null)}
                      onDelete={() => deleteMutation.mutate(item.id)}
                      onUpdate={(n) => updateItemMutation.mutate({ id: item.id, name: n })}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Dropdown menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1" onPress={() => setMenuOpen(false)}>
          <View
            style={{ position: 'absolute', top: 108, right: 12, minWidth: 180,
              shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
            className="bg-background border border-border rounded-2xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); setRenameName(activeList?.name ?? ''); setRenameOpen(true); }}
              className="px-4 py-3.5 border-b border-border active:bg-muted/50"
            >
              <Text className="text-foreground text-base">{t('shopping.renameList')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleInvite}
              className="px-4 py-3.5 border-b border-border active:bg-muted/50"
            >
              <Text className="text-foreground text-base">{t('shopping.invite')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteList}
              className="px-4 py-3.5 active:bg-muted/50"
            >
              <Text className="text-destructive text-base">{t('shopping.deleteList')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
  isEditing,
  draggable,
  onToggle,
  onLongPress,
  onBlurEdit,
  onDelete,
  onUpdate,
}: {
  item: ShoppingItem;
  showDivider: boolean;
  isEditing: boolean;
  draggable?: boolean;
  onToggle: () => void;
  onLongPress: () => void;
  onBlurEdit: () => void;
  onDelete: () => void;
  onUpdate: (name: string) => void;
}) {
  const [editName, setEditName] = useState(item.name);

  // Keep local edit name in sync when item name changes externally
  if (!isEditing && editName !== item.name) {
    setEditName(item.name);
  }

  function handleBlur() {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditName(item.name);
    } else if (trimmed !== item.name) {
      onUpdate(trimmed);
    }
    onBlurEdit();
  }

  return (
    <View className={`flex-row items-center px-4 py-2.5 gap-3 ${showDivider ? 'border-b border-border' : ''}`}>
      {draggable ? (
        <Sortable.Handle>
          <View style={{ paddingHorizontal: 2, justifyContent: 'center' }}>
            <Ionicons name="reorder-three-outline" size={18} color="#b06060" style={{ opacity: 0.5 }} />
          </View>
        </Sortable.Handle>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <Pressable onPress={onToggle} hitSlop={8} className="active:opacity-75 shrink-0">
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
            item.checked ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {item.checked && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
      </Pressable>
      {isEditing ? (
        <TextInput
          autoFocus
          className="flex-1 text-base text-foreground py-0.5"
          value={editName}
          onChangeText={setEditName}
          onBlur={handleBlur}
          editable={!item.id.startsWith('temp-')}
          multiline={false}
          returnKeyType="done"
          blurOnSubmit
        />
      ) : (
        <TouchableOpacity
          onPress={onToggle}
          onLongPress={onLongPress}
          delayLongPress={400}
          className="flex-1 py-0.5 active:opacity-75"
        >
          <Text className={`text-base text-foreground ${item.checked ? 'line-through opacity-50' : ''}`}>
            {item.name}
            {(item.quantity != null || item.unit) ? (
              <Text className="text-sm text-muted-foreground">
                {'  '}{[item.quantity, item.unit].filter(Boolean).join(' ')}
              </Text>
            ) : null}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onDelete} hitSlop={8} className="shrink-0">
        <Text className="text-muted-foreground text-lg px-1">×</Text>
      </TouchableOpacity>
    </View>
  );
}

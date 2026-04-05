import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import type { ShoppingItem } from '@recipe-app/shared';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

import { apiFetch } from '../../lib/api';

export default function ShoppingListScreen() {
  const { getToken } = useAuth();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: () => apiFetch<ShoppingItem[]>('/api/shopping-list', getToken),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-destructive">Failed to load shopping list</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-2xl font-bold text-foreground">Shopping List</Text>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <Text className="text-center text-muted-foreground mt-8">Your list is empty</Text>
        }
        renderItem={({ item }) => (
          <View className={`flex-row items-center bg-card border border-border rounded-xl px-4 py-3 gap-3 ${item.checked ? 'opacity-50' : ''}`}>
            <View className={`w-5 h-5 rounded-full border-2 ${item.checked ? 'bg-primary border-primary' : 'border-border'}`} />
            <Text className={`flex-1 text-base text-foreground ${item.checked ? 'line-through' : ''}`}>
              {item.name}
            </Text>
            {(item.quantity != null || item.unit) && (
              <Text className="text-sm text-muted-foreground">
                {[item.quantity?.toString(), item.unit].filter(Boolean).join(' ')}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

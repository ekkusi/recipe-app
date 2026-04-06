import * as SecureStore from 'expo-secure-store';

const KEY = 'activeShoppingListId';

export async function getActiveListId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setActiveListId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, id);
}

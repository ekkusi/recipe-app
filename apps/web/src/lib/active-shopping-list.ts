const KEY = "activeShoppingListId";

export function getActiveListId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setActiveListId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
}

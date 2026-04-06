"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, MoreVertical, X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingItem } from "@/components/shopping-list/shopping-item";
import { UNITS } from "@/lib/units";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { getActiveListId, setActiveListId } from "@/lib/active-shopping-list";
import type { ShoppingList, ShoppingItem as ShoppingItemType } from "@recipe-app/shared";

export default function ShoppingListPage() {
  const t = useTranslations("shopping");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListIdState] = useState<string | null>(
    searchParams.get("list") ?? getActiveListId()
  );

  function switchList(id: string) {
    setActiveListIdState(id);
    setActiveListId(id);
  }
  const [items, setItems] = useState<ShoppingItemType[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [newListName, setNewListName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;

  // Load lists on mount
  useEffect(() => {
    fetch("/api/shopping-lists")
      .then((r) => r.json())
      .then((data: ShoppingList[]) => {
        setLists(data);
        if (!activeListId && data.length > 0) switchList(data[0].id);
      });
  }, []);

  // Load items when active list changes
  useEffect(() => {
    if (!activeListId) return;
    fetch(`/api/shopping-lists/${activeListId}`)
      .then((r) => r.json())
      .then(setItems);
  }, [activeListId]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!activeListId) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`list-${activeListId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_list_items",
          filter: `list_id=eq.${activeListId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((i) => i.id === (payload.new as ShoppingItemType).id)) return prev;
              return [payload.new as ShoppingItemType, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((i) => (i.id === (payload.new as ShoppingItemType).id ? (payload.new as ShoppingItemType) : i))
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeListId]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleListChange(value: string | null) {
    if (!value) return;
    if (value === "__new__") {
      setNewListName("");
      setNewListOpen(true);
      return;
    }
    switchList(value);
    router.replace(`/shopping-list?list=${value}`);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !activeListId) return;
    setAdding(true);
    try {
      await fetch(`/api/shopping-lists/${activeListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantity ? parseFloat(quantity) : null,
          unit: unit || null,
        }),
      });
      setName("");
      setQuantity("");
      setUnit("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    if (!activeListId) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)));
    await fetch(`/api/shopping-lists/${activeListId}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
  }

  async function handleDelete(id: string) {
    if (!activeListId) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch(`/api/shopping-lists/${activeListId}/items/${id}`, { method: "DELETE" });
  }

  async function handleClearChecked() {
    if (!activeListId) return;
    setItems((prev) => prev.filter((item) => !item.checked));
    await fetch(`/api/shopping-lists/${activeListId}/items/clear-checked`, { method: "DELETE" });
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameName.trim() || !activeListId) return;
    await fetch(`/api/shopping-lists/${activeListId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    setLists((prev) => prev.map((l) => (l.id === activeListId ? { ...l, name: renameName.trim() } : l)));
    setRenameOpen(false);
  }

  async function handleInvite() {
    if (!activeListId) return;
    setMenuOpen(false);
    const res = await fetch(`/api/shopping-lists/${activeListId}/invite`);
    const { url } = await res.json();
    await navigator.clipboard.writeText(url);
    alert(t("inviteLinkCopied"));
  }

  async function handleDeleteList() {
    if (!activeListId) return;
    setMenuOpen(false);
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/shopping-lists/${activeListId}`, { method: "DELETE" });
    const remaining = lists.filter((l) => l.id !== activeListId);
    if (remaining.length === 0) {
      // Auto-create "Oma"
      const res = await fetch("/api/shopping-lists");
      const data: ShoppingList[] = await res.json();
      setLists(data);
      if (data[0]?.id) switchList(data[0].id);
    } else {
      setLists(remaining);
      switchList(remaining[0].id);
    }
    setItems([]);
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const res = await fetch("/api/shopping-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    const list: ShoppingList = await res.json();
    setLists((prev) => [...prev, list]);
    switchList(list.id);
    router.replace(`/shopping-list?list=${list.id}`);
    setNewListOpen(false);
    setItems([]);
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <>
      {/* Header with list selector + hamburger */}
      <div className="flex items-center gap-2 pt-4 pb-2">
        <div className="flex-1">
          <Select value={activeListId ?? ""} onValueChange={handleListChange}>
            <SelectTrigger className="rounded-xl border-none bg-transparent text-xl font-bold text-foreground px-0 focus:ring-0 focus:ring-offset-0 h-auto py-0">
              <span>{activeList?.name ?? t("title")}</span>
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
              <SelectItem value="__new__" className="text-primary font-semibold">
                + {t("newList")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {activeList && (
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical size={20} />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-2xl shadow-lg z-50 min-w-[160px] overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-secondary/50"
                  onClick={() => { setRenameName(activeList.name); setRenameOpen(true); setMenuOpen(false); }}
                >
                  {t("renameList")}
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-secondary/50"
                  onClick={handleInvite}
                >
                  {t("invite")}
                </button>
                {activeList.owner_id && (
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteList}
                  >
                    {t("deleteList")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="py-4 flex flex-col gap-4">
        {/* Add item form */}
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-3xl border border-border p-4 flex flex-col gap-3"
        >
          <div className="flex gap-2">
            <Input
              placeholder={t("addPlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl"
            />
            <Button
              type="submit"
              disabled={adding || !name.trim()}
              size="icon"
              className="rounded-xl shrink-0"
            >
              <Plus size={18} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={t("qtyPlaceholder")}
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 rounded-xl"
            />
            <Select
              value={unit || "__none__"}
              onValueChange={(v) => setUnit(!v || v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="flex-1 rounded-xl">
                <SelectValue placeholder={t("unitOptional")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("noUnit")}</SelectItem>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        {/* Unchecked items */}
        {unchecked.length > 0 && (
          <div className="bg-white rounded-3xl border border-border divide-y divide-border overflow-hidden">
            {unchecked.map((item) => (
              <ShoppingItem
                key={item.id}
                {...item}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Checked items */}
        {checked.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("done", { count: checked.length })}
              </p>
              <button
                type="button"
                onClick={handleClearChecked}
                className="text-xs text-muted-foreground hover:text-destructive underline"
              >
                {t("clearAll")}
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-border divide-y divide-border overflow-hidden opacity-70">
              {checked.map((item) => (
                <ShoppingItem
                  key={item.id}
                  {...item}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🛒</p>
            <p className="font-semibold">{t("empty.title")}</p>
            <p className="text-sm mt-1">{t("empty.subtitle")}</p>
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{t("renameList")}</h2>
              <button onClick={() => setRenameOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRename} className="flex flex-col gap-3">
              <Input
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="rounded-xl"
              />
              <Button type="submit" className="rounded-xl" disabled={!renameName.trim()}>
                <Check size={16} className="mr-2" />
                {t("save")}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* New list modal */}
      {newListOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{t("newList")}</h2>
              <button onClick={() => setNewListOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateList} className="flex flex-col gap-3">
              <Input
                autoFocus
                placeholder={t("listNamePlaceholder")}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="rounded-xl"
              />
              <Button type="submit" className="rounded-xl" disabled={!newListName.trim()}>
                {t("createList")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

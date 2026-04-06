"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type CollectionRow = { id: string; name: string; collection_recipes: { recipe_id: string }[] };

export function AddToCollectionButton({ recipeId }: { recipeId: string }) {
  const t = useTranslations("collections");
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/collections")
        .then((r) => r.json())
        .then((data: CollectionRow[]) => {
          setCollections(data);
          setSelectedIds(
            new Set(
              data
                .filter((c) => c.collection_recipes.some((cr) => cr.recipe_id === recipeId))
                .map((c) => c.id)
            )
          );
        });
    }
  }, [open, recipeId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function toggle(collectionId: string) {
    const isSelected = selectedIds.has(collectionId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      isSelected ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
    if (isSelected) {
      await fetch(`/api/collections/${collectionId}/recipes/${recipeId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/collections/${collectionId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
    }
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const { id } = await res.json();
    setCollections((prev) => [...prev, { id, name: newName.trim(), collection_recipes: [] }]);
    setNewName("");
    await toggle(id);
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <FolderPlus size={14} />
        {t("addToCollection")}
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border rounded-2xl shadow-lg p-2 min-w-48">
          {collections.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">{t("empty.title")}</p>
          )}
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => toggle(col.id)}
              className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted flex items-center justify-between gap-2"
            >
              {col.name}
              {selectedIds.has(col.id) && <Check size={14} className="text-primary shrink-0" />}
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1 flex gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
              placeholder={t("name")}
              className="flex-1 text-sm px-2 py-1.5 rounded-lg bg-muted outline-none"
            />
            <button
              onClick={createAndAdd}
              className="text-sm px-2 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Collection = { id: string; name: string };

export function AddToCollectionButton({ recipeId }: { recipeId: string }) {
  const t = useTranslations("collections");
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/collections").then((r) => r.json()).then(setCollections);
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function addTo(collectionId: string) {
    await fetch(`/api/collections/${collectionId}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });
    setAdded(collectionId);
    setTimeout(() => { setAdded(null); setOpen(false); }, 1000);
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const { id } = await res.json();
    setNewName("");
    await addTo(id);
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
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => addTo(col.id)}
              className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted flex items-center justify-between gap-2"
            >
              {col.name}
              {added === col.id && <Check size={14} className="text-primary" />}
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

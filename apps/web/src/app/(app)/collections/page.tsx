"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

type Collection = { id: string; name: string; collection_recipes: { recipe_id: string }[] };

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then(setCollections)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const { id } = await res.json();
      setCollections((prev) => [{ id, name: newName.trim(), collection_recipes: [] }, ...prev]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <>
      <Header title={t("title")} />
      <div className="py-4 flex flex-col gap-4">
        {/* Create new */}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t("name")}
            className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            size="sm"
            className="rounded-xl gap-1.5"
          >
            <Plus size={14} />
            {t("new")}
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{tCommon("loading")}</div>
        ) : collections.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-2">
            <FolderOpen size={40} className="text-muted-foreground/50" />
            <p className="font-semibold">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground">{t("empty.subtitle")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {collections.map((col) => (
              <div key={col.id} className="flex items-center gap-3 bg-white rounded-2xl border border-border px-4 py-3">
                <Link href={`/collections/${col.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{col.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("recipeCount", { count: col.collection_recipes?.length ?? 0 })}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, ChefHat, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";

type Recipe = { id: string; title: string; description: string | null; difficulty: string | null; time_minutes: number | null };
type CollectionData = { id: string; name: string; collection_recipes: { added_at: string; recipes: Recipe }[] };

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");
  const tRecipes = useTranslations("recipes");
  const [data, setData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRemove(recipeId: string) {
    await fetch(`/api/collections/${id}/recipes/${recipeId}`, { method: "DELETE" });
    setData((prev) =>
      prev ? { ...prev, collection_recipes: prev.collection_recipes.filter((cr) => cr.recipes.id !== recipeId) } : prev
    );
  }

  const recipes = data?.collection_recipes.map((cr) => cr.recipes) ?? [];

  return (
    <>
      <Header title={data?.name ?? tCommon("loading")} />
      <div className="py-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{tCommon("loading")}</div>
        ) : recipes.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-2">
            <p className="font-semibold">{t("emptyCollection.title")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyCollection.subtitle")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center gap-3 bg-white rounded-2xl border border-border px-4 py-3">
                <Link href={`/recipes/${recipe.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{recipe.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {recipe.difficulty && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ChefHat size={11} />
                        {tRecipes(`difficulty.${recipe.difficulty}`)}
                      </span>
                    )}
                    {recipe.time_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {tRecipes("timeMinutes", { time: recipe.time_minutes })}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(recipe.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title={t("removeFromCollection")}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

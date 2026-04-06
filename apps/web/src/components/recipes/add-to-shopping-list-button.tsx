"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getActiveListId } from "@/lib/active-shopping-list";

type Ingredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

export function AddToShoppingListButton({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  const t = useTranslations('recipes');
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleAdd() {
    setState("loading");
    try {
      await fetch("/api/shopping-list/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, listId: getActiveListId() }),
      });
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl gap-1.5"
      onClick={handleAdd}
      disabled={state !== "idle"}
    >
      {state === "done" ? (
        <>
          <Check size={14} className="text-green-600" />
          {t('added')}
        </>
      ) : (
        <>
          <ShoppingCart size={14} />
          {state === "loading" ? t('adding') : t('addToList')}
        </>
      )}
    </Button>
  );
}

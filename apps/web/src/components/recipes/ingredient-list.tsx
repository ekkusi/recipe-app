"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { getActiveListId } from "@/lib/active-shopping-list";
import type { Ingredient } from "@recipe-app/shared";

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const t = useTranslations("recipes");
  const nonHeaderIngredients = ingredients.filter((ing) => !ing.is_section_header);

  const [singleAdded, setSingleAdded] = useState<string | null>(null);

  async function addSingle(ing: Ingredient) {
    setSingleAdded(ing.id ?? ing.name);
    await fetch("/api/shopping-list/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: [{ name: ing.name, quantity: ing.quantity, unit: ing.unit }],
        listId: getActiveListId(),
      }),
    });
    setTimeout(() => setSingleAdded(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{t("ingredients")}</h2>
        {nonHeaderIngredients.length > 0 && (
          <BulkAddButton ingredients={nonHeaderIngredients} />
        )}
      </div>
      <div className="bg-white rounded-3xl border border-border divide-y divide-border overflow-hidden">
        {ingredients.map((ing, i) => {
          if (ing.is_section_header) {
            return (
              <div key={ing.id ?? i} className="px-4 py-2 bg-muted/40">
                <span className="text-sm font-bold text-foreground">{ing.name}</span>
              </div>
            );
          }
          const key = ing.id ?? ing.name;
          const added = singleAdded === key;
          return (
            <div key={key} className="flex items-center justify-between px-4 py-3 gap-2">
              <span className="font-medium flex-1">{ing.name}</span>
              {(ing.quantity || ing.unit) && (
                <span className="text-muted-foreground text-sm">
                  {ing.quantity} {ing.unit}
                </span>
              )}
              <button
                type="button"
                onClick={() => addSingle(ing)}
                disabled={added}
                className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-1"
                aria-label={t("addToList")}
              >
                {added ? (
                  <Check size={15} className="text-green-600" />
                ) : (
                  <ShoppingCart size={15} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BulkAddButton({ ingredients }: { ingredients: Ingredient[] }) {
  const t = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(ingredients.map((_, i) => i)));
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setSelected(new Set(ingredients.map((_, i) => i)));
      setState("idle");
    }
    setOpen(isOpen);
  }

  function toggleIngredient(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleConfirm() {
    setState("loading");
    const toAdd = ingredients.filter((_, i) => selected.has(i));
    await fetch("/api/shopping-list/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: toAdd.map((ing) => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit })),
        listId: getActiveListId(),
      }),
    });
    setState("done");
    setTimeout(() => setOpen(false), 1200);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" />
        }
      >
        <ShoppingCart size={14} />
        {t("addToList")}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("selectIngredients")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border max-h-72 overflow-y-auto -mx-4 px-4">
          {ingredients.map((ing, i) => (
            <label
              key={i}
              className="flex items-center gap-3 py-2.5 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleIngredient(i)}
                className="w-4 h-4 accent-primary"
              />
              <span className="flex-1 text-sm font-medium">{ing.name}</span>
              {(ing.quantity || ing.unit) && (
                <span className="text-xs text-muted-foreground">
                  {ing.quantity} {ing.unit}
                </span>
              )}
            </label>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
            {tCommon("cancel")}
          </DialogClose>
          <Button
            className="rounded-xl"
            disabled={selected.size === 0 || state !== "idle"}
            onClick={handleConfirm}
          >
            {state === "done" ? (
              <><Check size={14} className="mr-1" />{t("added")}</>
            ) : (
              <>{t("addSelected")}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

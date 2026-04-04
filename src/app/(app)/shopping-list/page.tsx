"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { ShoppingItem } from "@/components/shopping-list/shopping-item";
import { UNITS } from "@/lib/units";

type Item = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
};

export default function ShoppingListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/shopping-list")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantity ? parseFloat(quantity) : null,
          unit: unit || null,
        }),
      });
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setName("");
      setQuantity("");
      setUnit("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item))
    );
    await fetch(`/api/shopping-list/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch(`/api/shopping-list/${id}`, { method: "DELETE" });
  }

  async function handleClearChecked() {
    setItems((prev) => prev.filter((item) => !item.checked));
    await fetch("/api/shopping-list/clear-checked", { method: "DELETE" });
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <>
      <Header title="Shopping List" />

      <div className="py-4 flex flex-col gap-4">
        {/* Add item form */}
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-3xl border border-border p-4 flex flex-col gap-3"
        >
          <div className="flex gap-2">
            <Input
              placeholder="Add an item..."
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
              placeholder="Qty"
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
                <SelectValue placeholder="Unit (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No unit</SelectItem>
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
                Done ({checked.length})
              </p>
              <button
                type="button"
                onClick={handleClearChecked}
                className="text-xs text-muted-foreground hover:text-destructive underline"
              >
                Clear all
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
            <p className="font-semibold">Your list is empty</p>
            <p className="text-sm mt-1">Add items above or from a recipe</p>
          </div>
        )}
      </div>
    </>
  );
}

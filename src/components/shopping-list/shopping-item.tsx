"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShoppingItemProps {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItem({
  id,
  name,
  quantity,
  unit,
  checked,
  onToggle,
  onDelete,
}: ShoppingItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(id, !checked)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 12 10"
            fill="none"
            className="w-3 h-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 5l3 3 7-7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "font-medium transition-colors",
            checked && "line-through text-muted-foreground"
          )}
        >
          {name}
        </span>
        {(quantity || unit) && (
          <span className="text-sm text-muted-foreground ml-2">
            {quantity} {unit}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(id)}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 size={15} />
      </Button>
    </div>
  );
}

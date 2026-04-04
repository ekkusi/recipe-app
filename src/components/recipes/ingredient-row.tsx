"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS } from "@/lib/units";

export type IngredientRowValue = {
  name: string;
  quantity: string;
  unit: string;
};

interface IngredientRowProps {
  value: IngredientRowValue;
  onChange: (value: IngredientRowValue) => void;
  onRemove: () => void;
}

export function IngredientRow({ value, onChange, onRemove }: IngredientRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Ingredient name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        className="flex-1 rounded-xl"
      />
      <Input
        placeholder="Qty"
        type="number"
        min="0"
        step="any"
        value={value.quantity}
        onChange={(e) => onChange({ ...value, quantity: e.target.value })}
        className="w-20 rounded-xl text-center"
      />
      <Select
        value={value.unit || "__none__"}
        onValueChange={(v) => onChange({ ...value, unit: !v || v === "__none__" ? "" : v })}
      >
        <SelectTrigger className="w-28 rounded-xl">
          <SelectValue placeholder="Unit" />
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

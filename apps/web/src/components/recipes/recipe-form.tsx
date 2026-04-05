"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IngredientRow, IngredientRowValue } from "./ingredient-row";

type Tag = { id: string; name: string };
type Difficulty = "easy" | "medium" | "hard";

export type RecipeFormValues = {
  title: string;
  description: string;
  difficulty: Difficulty | "";
  time_minutes: string;
  ingredients: IngredientRowValue[];
  instructions: string[];
  tag_ids: string[];
};

interface RecipeFormProps {
  initialValues?: Partial<RecipeFormValues>;
  tags: Tag[];
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  submitLabel?: string;
}

const emptyIngredient = (): IngredientRowValue => ({
  name: "",
  quantity: "",
  unit: "",
});

export function RecipeForm({
  initialValues,
  tags,
  onSubmit,
  submitLabel = "Save Recipe",
}: RecipeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<RecipeFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    difficulty: initialValues?.difficulty ?? "",
    time_minutes: initialValues?.time_minutes ?? "",
    ingredients: initialValues?.ingredients ?? [emptyIngredient()],
    instructions: initialValues?.instructions ?? [""],
    tag_ids: initialValues?.tag_ids ?? [],
  });

  function updateIngredient(index: number, val: IngredientRowValue) {
    const next = [...values.ingredients];
    next[index] = val;
    setValues({ ...values, ingredients: next });
  }

  function removeIngredient(index: number) {
    setValues({
      ...values,
      ingredients: values.ingredients.filter((_, i) => i !== index),
    });
  }

  function updateInstruction(index: number, content: string) {
    const next = [...values.instructions];
    next[index] = content;
    setValues({ ...values, instructions: next });
  }

  function removeInstruction(index: number) {
    setValues({
      ...values,
      instructions: values.instructions.filter((_, i) => i !== index),
    });
  }

  function toggleTag(tagId: string) {
    const next = values.tag_ids.includes(tagId)
      ? values.tag_ids.filter((id) => id !== tagId)
      : [...values.tag_ids, tagId];
    setValues({ ...values, tag_ids: next });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Recipe Name *</Label>
        <Input
          id="title"
          required
          placeholder="e.g. Creamy Tomato Pasta"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          className="rounded-xl"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A brief description of the recipe..."
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      {/* Difficulty + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Difficulty</Label>
          <Select
            value={values.difficulty || "__none__"}
            onValueChange={(v) =>
              setValues({
                ...values,
                difficulty: !v || v === "__none__" ? "" : (v as Difficulty),
              })
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time">Time (minutes)</Label>
          <Input
            id="time"
            type="number"
            min="0"
            placeholder="e.g. 30"
            value={values.time_minutes}
            onChange={(e) =>
              setValues({ ...values, time_minutes: e.target.value })
            }
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = values.tag_ids.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="focus:outline-none"
              >
                <Badge
                  variant={selected ? "default" : "outline"}
                  className="rounded-full cursor-pointer capitalize transition-colors"
                >
                  {tag.name}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ingredients */}
      <div className="flex flex-col gap-3">
        <Label>Ingredients</Label>
        <div className="flex flex-col gap-2">
          {values.ingredients.map((ing, i) => (
            <IngredientRow
              key={i}
              value={ing}
              onChange={(val) => updateIngredient(i, val)}
              onRemove={() => removeIngredient(i)}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl self-start"
          onClick={() =>
            setValues({
              ...values,
              ingredients: [...values.ingredients, emptyIngredient()],
            })
          }
        >
          <Plus size={14} />
          Add Ingredient
        </Button>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-3">
        <Label>Instructions</Label>
        <div className="flex flex-col gap-2">
          {values.instructions.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 text-sm font-bold text-muted-foreground w-6 shrink-0 text-right">
                {i + 1}.
              </span>
              <Textarea
                placeholder={`Step ${i + 1}...`}
                value={step}
                onChange={(e) => updateInstruction(i, e.target.value)}
                className="flex-1 rounded-xl resize-none"
                rows={2}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInstruction(i)}
                className="mt-1 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl self-start"
          onClick={() =>
            setValues({
              ...values,
              instructions: [...values.instructions, ""],
            })
          }
        >
          <Plus size={14} />
          Add Step
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-2xl h-12"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-2xl h-12 font-semibold"
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

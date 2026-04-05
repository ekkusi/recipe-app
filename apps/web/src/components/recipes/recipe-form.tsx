"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { recipeFormSchema, type RecipeFormSchema } from "@recipe-app/shared";
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
import { IngredientRow } from "./ingredient-row";

export type { RecipeFormSchema as RecipeFormValues };

type Tag = { id: string; name: string };

interface RecipeFormProps {
  initialValues?: Partial<RecipeFormSchema>;
  tags: Tag[];
  onSubmit: (values: RecipeFormSchema) => Promise<void>;
  submitLabel?: string;
}

const emptyIngredient = () => ({ name: "", quantity: "", unit: "" });


export function RecipeForm({
  initialValues,
  tags,
  onSubmit,
  submitLabel,
}: RecipeFormProps) {
  const router = useRouter();
  const t = useTranslations('recipes');
  const tCommon = useTranslations('common');
  const resolvedSubmitLabel = submitLabel ?? t('saveRecipe');
  const [autoFocusIngredientIndex, setAutoFocusIngredientIndex] = useState<number | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormSchema>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      difficulty: initialValues?.difficulty ?? null,
      time_minutes: initialValues?.time_minutes ?? "",
      ingredients: initialValues?.ingredients?.length
        ? initialValues.ingredients
        : [emptyIngredient()],
      instructions: initialValues?.instructions?.length
        ? initialValues.instructions
        : [{ content: "" }],
      tag_ids: initialValues?.tag_ids ?? [],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: "ingredients" });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({ control, name: "instructions" });

  const tag_ids = watch("tag_ids");

  function toggleTag(tagId: string) {
    const next = tag_ids.includes(tagId)
      ? tag_ids.filter((id) => id !== tagId)
      : [...tag_ids, tagId];
    setValue("tag_ids", next);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 py-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t('form.name')}</Label>
        <Input
          id="title"
          placeholder={t('form.namePlaceholder')}
          {...register("title")}
          className="rounded-xl"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">{t('form.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('form.descriptionPlaceholder')}
          {...register("description")}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      {/* Difficulty + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t('difficulty.label')}</Label>
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <Select
                value={field.value ?? "__none__"}
                onValueChange={(v) =>
                  field.onChange(!v || v === "__none__" ? null : v)
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  <SelectItem value="easy">{t('difficulty.easy')}</SelectItem>
                  <SelectItem value="medium">{t('difficulty.medium')}</SelectItem>
                  <SelectItem value="hard">{t('difficulty.hard')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time">{t('form.time')}</Label>
          <Input
            id="time"
            type="number"
            min="0"
            placeholder="30"
            {...register("time_minutes")}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <Label>{t('form.tags')}</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = tag_ids.includes(tag.id);
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
        <Label>{t('form.ingredients')}</Label>
        <div className="flex flex-col gap-2">
          {ingredientFields.map((field, i) => (
            <Controller
              key={field.id}
              control={control}
              name={`ingredients.${i}`}
              render={({ field: f }) => (
                <IngredientRow
                  value={f.value}
                  onChange={f.onChange}
                  onRemove={() => removeIngredient(i)}
                  autoFocus={autoFocusIngredientIndex === i}
                />
              )}
            />
          ))}
        </div>
        {errors.ingredients?.root && (
          <p className="text-sm text-destructive">{errors.ingredients.root.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl self-start"
          onClick={() => {
            setAutoFocusIngredientIndex(ingredientFields.length);
            appendIngredient(emptyIngredient());
          }}
        >
          <Plus size={14} />
          {t('form.addIngredient')}
        </Button>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-3">
        <Label>{t('instructions')}</Label>
        <div className="flex flex-col gap-2">
          {instructionFields.map((field, i) => (
            <div key={field.id} className="flex items-start gap-2">
              <span className="mt-2.5 text-sm font-bold text-muted-foreground w-6 shrink-0 text-right">
                {i + 1}.
              </span>
              <Textarea
                placeholder={t('form.stepPlaceholder', { step: i + 1 })}
                {...register(`instructions.${i}.content`)}
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
        {errors.instructions?.root && (
          <p className="text-sm text-destructive">{errors.instructions.root.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl self-start"
          onClick={() => {
            const newIndex = instructionFields.length;
            appendInstruction({ content: "" });
            setTimeout(() => setFocus(`instructions.${newIndex}.content`), 0);
          }}
        >
          <Plus size={14} />
          {t('form.addStep')}
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
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-2xl h-12 font-semibold"
        >
          {isSubmitting ? tCommon('saving') : resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}

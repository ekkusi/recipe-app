"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { recipeFormSchema, type RecipeFormSchema, parseIngredientLine } from "@recipe-app/shared";
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

const emptyIngredient = () => ({ name: "", quantity: "", unit: "", is_section_header: false });
const emptySubtitle = () => ({ name: "", quantity: "", unit: "", is_section_header: true });

function SortableStepItem({
  id,
  index,
  register,
  onRemove,
  stepPlaceholder,
}: {
  id: string;
  index: number;
  register: ReturnType<typeof useForm<RecipeFormSchema>>["register"];
  onRemove: () => void;
  stepPlaceholder: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={16} />
      </button>
      <span className="mt-2.5 text-sm font-bold text-muted-foreground w-6 shrink-0 text-right">
        {index + 1}.
      </span>
      <Textarea
        placeholder={stepPlaceholder}
        {...register(`instructions.${index}.content`)}
        className="flex-1 rounded-xl resize-none"
        rows={2}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="mt-1 text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}


export function RecipeForm({
  initialValues,
  tags,
  onSubmit,
  submitLabel,
}: RecipeFormProps) {
  const router = useRouter();
  const t = useTranslations('recipes');
  const tCommon = useTranslations('common');
  const tPrivacy = useTranslations('privacy');
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
      is_private: initialValues?.is_private ?? false,
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
    move: moveInstruction,
  } = useFieldArray({ control, name: "instructions" });

  const tag_ids = watch("tag_ids");

  function toggleTag(tagId: string) {
    const next = tag_ids.includes(tagId)
      ? tag_ids.filter((id) => id !== tagId)
      : [...tag_ids, tagId];
    setValue("tag_ids", next);
  }

  const sensors = useSensors(useSensor(PointerSensor));

  function handleInstructionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = instructionFields.findIndex((f) => f.id === active.id);
    const toIndex = instructionFields.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) moveInstruction(fromIndex, toIndex);
  }

  async function pasteIngredients() {
    const text = await navigator.clipboard.readText().catch(() => "");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      const parsed = parseIngredientLine(line);
      appendIngredient({
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        is_section_header: false,
      });
    });
  }

  async function pasteInstructions() {
    const text = await navigator.clipboard.readText().catch(() => "");
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^(\d+[.)]\s*|[-*•–]\s*)/, "").trim())
      .filter(Boolean);
    lines.forEach((content) => appendInstruction({ content }));
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

      {/* Privacy */}
      <Controller
        control={control}
        name="is_private"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-primary"
            />
            <Label htmlFor="is_private" className="cursor-pointer text-sm font-normal">
              {tPrivacy('private')}
            </Label>
          </div>
        )}
      />

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
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setAutoFocusIngredientIndex(ingredientFields.length);
              appendIngredient(emptyIngredient());
            }}
          >
            <Plus size={14} />
            {t('form.addIngredient')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setAutoFocusIngredientIndex(ingredientFields.length);
              appendIngredient(emptySubtitle());
            }}
          >
            {t('form.addSubtitle')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={pasteIngredients}
          >
            {t('form.pasteFromClipboard')}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-3">
        <Label>{t('instructions')}</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleInstructionDragEnd}
        >
          <SortableContext
            items={instructionFields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {instructionFields.map((field, i) => (
                <SortableStepItem
                  key={field.id}
                  id={field.id}
                  index={i}
                  register={register}
                  onRemove={() => removeInstruction(i)}
                  stepPlaceholder={t('form.stepPlaceholder', { step: i + 1 })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {errors.instructions?.root && (
          <p className="text-sm text-destructive">{errors.instructions.root.message}</p>
        )}
        <div className="flex gap-2 flex-wrap">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl self-start"
            onClick={pasteInstructions}
          >
            {t('form.pasteFromClipboard')}
          </Button>
        </div>
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

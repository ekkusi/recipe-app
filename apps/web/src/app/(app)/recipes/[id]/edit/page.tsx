"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { RecipeForm, RecipeFormValues } from "@/components/recipes/recipe-form";

type Tag = { id: string; name: string };

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('recipes');
  const tCommon = useTranslations('common');
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialValues, setInitialValues] = useState<Partial<RecipeFormValues>>();

  useEffect(() => {
    Promise.all([
      fetch("/api/tags").then((r) => r.json()),
      fetch(`/api/recipes/${id}`).then((r) => r.json()),
    ]).then(([tagsData, recipe]) => {
      setTags(tagsData);
      setInitialValues({
        title: recipe.title,
        description: recipe.description ?? "",
        difficulty: recipe.difficulty ?? null,
        time_minutes: recipe.time_minutes?.toString() ?? "",
        ingredients: (recipe.recipe_ingredients ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((ing: { name: string; quantity: string | null; unit: string | null; is_section_header: boolean }) => ({
            name: ing.name,
            quantity: ing.quantity ?? "",
            unit: ing.unit ?? "",
            is_section_header: ing.is_section_header ?? false,
          })),
        instructions: (recipe.recipe_instructions ?? [])
          .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
          .map((ins: { content: string }) => ({ content: ins.content })),
        tag_ids: (recipe.recipe_tags ?? []).map(
          (rt: { tag_id: string }) => rt.tag_id
        ),
        is_private: recipe.is_private ?? false,
      });
    });
  }, [id]);

  async function handleSubmit(values: RecipeFormValues) {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Failed to update recipe");
    router.push(`/recipes/${id}`);
  }

  if (!initialValues) {
    return (
      <>
        <Header title={t('editRecipe')} />
        <div className="py-16 text-center text-muted-foreground">{tCommon('loading')}</div>
      </>
    );
  }

  return (
    <>
      <Header title={t('editRecipe')} />
      <RecipeForm
        tags={tags}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={t('saveChanges')}
      />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { RecipeForm, RecipeFormValues } from "@/components/recipes/recipe-form";
import { useEffect, useState } from "react";

type Tag = { id: string; name: string };

export default function NewRecipePage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  async function handleSubmit(values: RecipeFormValues) {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Failed to create recipe");
    const { id } = await res.json();
    router.push(`/recipes/${id}`);
  }

  return (
    <>
      <Header title="New Recipe" />
      <RecipeForm tags={tags} onSubmit={handleSubmit} submitLabel="Create Recipe" />
    </>
  );
}

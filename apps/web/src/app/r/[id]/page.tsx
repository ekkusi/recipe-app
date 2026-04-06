import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Clock, ChefHat, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecipeById } from "@/lib/db/recipes";
import { CopyRecipeButton } from "@/components/recipes/copy-recipe-button";

export default async function PublicRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const t = await getTranslations("recipes");
  const tPrivacy = await getTranslations("privacy");

  let recipe;
  try {
    recipe = await getRecipeById(id);
  } catch {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  if (recipe.is_private) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center flex flex-col items-center gap-3">
          <Lock size={40} className="text-muted-foreground" />
          <p className="text-lg font-semibold">{tPrivacy("isPrivateRecipe")}</p>
          {!userId && (
            <Button render={<Link href="/sign-in" />} nativeButton={false} variant="outline" className="rounded-2xl mt-2">
              Kirjaudu sisään
            </Button>
          )}
        </div>
      </div>
    );
  }

  const tags = recipe.recipe_tags?.map((rt) => rt.tags) ?? [];
  const ingredients = [...(recipe.recipe_ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const instructions = [...(recipe.recipe_instructions ?? [])].sort((a, b) => a.step_number - b.step_number);
  const isOwner = userId === recipe.user_id;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">{recipe.title}</h1>
          {userId && !isOwner && <CopyRecipeButton recipeId={id} />}
          {isOwner && (
            <Button
              render={<Link href={`/recipes/${id}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="rounded-xl shrink-0"
            >
              {t("editRecipe")} →
            </Button>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {recipe.difficulty && (
            <Badge variant="outline" className="rounded-full capitalize">
              <ChefHat size={12} className="mr-1" />
              {t(`difficulty.${recipe.difficulty}`)}
            </Badge>
          )}
          {recipe.time_minutes && (
            <Badge variant="outline" className="rounded-full">
              <Clock size={12} className="mr-1" />
              {t("timeMinutes", { time: recipe.time_minutes })}
            </Badge>
          )}
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="rounded-full capitalize">
              {tag.name}
            </Badge>
          ))}
        </div>

        {recipe.description && (
          <p className="text-muted-foreground leading-relaxed mb-6">{recipe.description}</p>
        )}

        {ingredients.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">{t("ingredients")}</h2>
            <div className="bg-white rounded-3xl border border-border divide-y divide-border overflow-hidden">
              {ingredients.map((ing, i) => {
                if (ing.is_section_header) {
                  return (
                    <div key={ing.id ?? i} className="px-4 py-2 bg-muted/40">
                      <span className="text-sm font-bold text-foreground">{ing.name}</span>
                    </div>
                  );
                }
                return (
                  <div key={ing.id ?? i} className="flex items-center justify-between px-4 py-3">
                    <span className="font-medium">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-muted-foreground text-sm">
                        {ing.quantity} {ing.unit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {instructions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">{t("instructions")}</h2>
            <div className="flex flex-col gap-3">
              {instructions.map((ins) => (
                <div key={ins.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {ins.step_number}
                  </div>
                  <p className="flex-1 text-foreground leading-relaxed pt-1">{ins.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!userId && (
          <div className="mt-10 text-center">
            <Button render={<Link href="/sign-in" />} nativeButton={false} className="rounded-2xl px-8">
              Kirjaudu tallentaaksesi reseptin
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

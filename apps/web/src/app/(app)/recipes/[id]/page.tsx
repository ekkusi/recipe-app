import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Pencil, Clock, ChefHat, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { getRecipeById } from "@/lib/db/recipes";
import { IngredientList } from "@/components/recipes/ingredient-list";
import { ShareRecipeButton } from "@/components/recipes/share-recipe-button";
import { CopyRecipeButton } from "@/components/recipes/copy-recipe-button";
import { AddToCollectionButton } from "@/components/recipes/add-to-collection-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const t = await getTranslations('recipes');
  const tPrivacy = await getTranslations('privacy');

  let recipe;
  try {
    recipe = await getRecipeById(id);
    if (recipe.is_private && recipe.user_id !== userId) notFound();
  } catch {
    notFound();
  }

  const isOwner = recipe.user_id === userId;

  const tags = recipe.recipe_tags?.map(
    (rt: { tags: { id: string; name: string } }) => rt.tags
  ) ?? [];

  const ingredients = [...(recipe.recipe_ingredients ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const instructions = [...(recipe.recipe_instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number
  );

  return (
    <>
      <Header
        title={recipe.title}
        action={
          isOwner ? (
            <Button
              render={<Link href={`/recipes/${id}/edit`} />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="rounded-xl"
            >
              <Pencil size={18} />
            </Button>
          ) : undefined
        }
      />

      <div className="py-4 flex flex-col gap-6">
        {/* Owner actions: share + collection */}
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <ShareRecipeButton recipeId={id} isPrivate={recipe.is_private} />
            <AddToCollectionButton recipeId={id} />
          </div>
        )}
        {/* Non-owner: copy */}
        {!isOwner && userId && (
          <div className="flex gap-2">
            <CopyRecipeButton recipeId={id} />
          </div>
        )}
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          {recipe.is_private && (
            <Badge variant="outline" className="rounded-full gap-1 text-muted-foreground">
              <Lock size={11} />
              {tPrivacy('private')}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="outline" className="rounded-full capitalize">
              <ChefHat size={12} className="mr-1" />
              {t(`difficulty.${recipe.difficulty}`)}
            </Badge>
          )}
          {recipe.time_minutes && (
            <Badge variant="outline" className="rounded-full">
              <Clock size={12} className="mr-1" />
              {t('timeMinutes', { time: recipe.time_minutes })}
            </Badge>
          )}
          {tags.map((tag: { id: string; name: string }) => (
            <Badge key={tag.id} variant="outline" className="rounded-full capitalize">
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-muted-foreground leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <IngredientList ingredients={ingredients} />
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">{t('instructions')}</h2>
            <div className="flex flex-col gap-3">
              {instructions.map((ins) => (
                <div key={ins.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {ins.step_number}
                  </div>
                  <p className="flex-1 text-foreground leading-relaxed pt-1">
                    {ins.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

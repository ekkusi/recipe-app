import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { getRecipes } from "@/lib/db/recipes";

export default async function RecipesPage() {
  const { userId } = await auth();
  const recipes = await getRecipes(userId!);

  return (
    <>
      <Header
        title="Recipes"
        action={
          <Button
            render={<Link href="/recipes/new" />}
            nativeButton={false}
            size="sm"
            className="rounded-xl"
          >
            <Plus size={16} />
            New
          </Button>
        }
      />
      <div className="py-4 flex flex-col gap-3">
        {recipes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🍳</p>
            <p className="font-semibold">No recipes yet</p>
            <p className="text-sm mt-1">Add your first recipe to get started</p>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recipes.map((recipe: any) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              description={recipe.description ?? null}
              difficulty={recipe.difficulty as "easy" | "medium" | "hard" | null}
              time_minutes={recipe.time_minutes ?? null}
              tags={recipe.recipe_tags?.map((rt: { tags: { id: string; name: string } }) => rt.tags) ?? []}
            />
          ))
        )}
      </div>
    </>
  );
}

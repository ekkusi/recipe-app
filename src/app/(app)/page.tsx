import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { BookOpen, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div className="pt-8 pb-4">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-medium">Good day,</p>
        <h1 className="text-3xl font-bold mt-0.5">Hey {firstName} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/recipes" className="group">
          <div className="rounded-3xl bg-primary/10 border border-primary/20 p-6 flex flex-col gap-3 hover:bg-primary/15 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Recipes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Browse your collection</p>
            </div>
          </div>
        </Link>

        <Link href="/shopping-list" className="group">
          <div className="rounded-3xl bg-secondary/50 border border-secondary p-6 flex flex-col gap-3 hover:bg-secondary/70 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingCart size={20} className="text-secondary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">Shopping</p>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your list</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-6">
        <Button
          render={<Link href="/recipes/new" />}
          nativeButton={false}
          className="w-full rounded-2xl h-12 font-semibold"
        >
          <Plus size={18} />
          Add a Recipe
        </Button>
      </div>
    </div>
  );
}

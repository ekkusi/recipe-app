import Link from "next/link";
import { Clock, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tag = { id: string; name: string };

interface RecipeCardProps {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  time_minutes: number | null;
  tags: Tag[];
}

const difficultyColors = {
  easy: "bg-secondary/60 text-secondary-foreground border-secondary",
  medium: "bg-accent/60 text-accent-foreground border-accent",
  hard: "bg-primary/15 text-primary border-primary/30",
};

export function RecipeCard({
  id,
  title,
  description,
  difficulty,
  time_minutes,
  tags,
}: RecipeCardProps) {
  return (
    <Link href={`/recipes/${id}`}>
      <div className="bg-white rounded-3xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-lg leading-tight">{title}</h2>
          {difficulty && (
            <Badge
              variant="outline"
              className={`capitalize rounded-full shrink-0 text-xs ${difficultyColors[difficulty]}`}
            >
              {difficulty}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="rounded-full capitalize text-xs"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          {time_minutes && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm shrink-0">
              <Clock size={14} />
              <span>{time_minutes} min</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

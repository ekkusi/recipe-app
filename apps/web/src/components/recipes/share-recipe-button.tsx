"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ShareRecipeButton({ recipeId, isPrivate }: { recipeId: string; isPrivate: boolean }) {
  const t = useTranslations("privacy");
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/r/${recipeId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        onClick={handleShare}
      >
        <Share2 size={14} />
        {copied ? t("linkCopied") : t("shareLink")}
      </Button>
      {isPrivate && (
        <p className="text-xs text-destructive">{t("privateWarning")}</p>
      )}
    </div>
  );
}

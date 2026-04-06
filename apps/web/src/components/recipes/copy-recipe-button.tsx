"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function CopyRecipeButton({ recipeId }: { recipeId: string }) {
  const t = useTranslations("privacy");
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [done, setDone] = useState(false);

  async function handleCopy() {
    setCopying(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/copy`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { id } = await res.json();
      setDone(true);
      setTimeout(() => router.push(`/recipes/${id}`), 800);
    } finally {
      setCopying(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl shrink-0 gap-1.5"
      onClick={handleCopy}
      disabled={copying || done}
    >
      <Copy size={14} />
      {done ? t("copiedToCollection") : copying ? "…" : t("copyToCollection")}
    </Button>
  );
}

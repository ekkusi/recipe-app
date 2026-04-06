"use client";

import { useState } from "react";
import { Lock, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrivacyToggle({ recipeId, initialIsPrivate }: { recipeId: string; initialIsPrivate: boolean }) {
  const t = useTranslations("privacy");
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      await fetch(`/api/recipes/${recipeId}/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_private: !isPrivate }),
      });
      setIsPrivate((p) => !p);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl gap-1.5"
      onClick={toggle}
      disabled={saving}
    >
      {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
      {isPrivate ? t("private") : t("public")}
    </Button>
  );
}

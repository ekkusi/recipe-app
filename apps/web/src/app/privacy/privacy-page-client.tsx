"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

interface PrivacyPageClientProps {
  currentLang: "en" | "fi";
}

export default function PrivacyPageClient({
  currentLang,
}: PrivacyPageClientProps) {
  const router = useRouter();

  const toggleLanguage = () => {
    const newLang = currentLang === "en" ? "fi" : "en";
    const newUrl = newLang === "en" ? "/privacy?lang=en" : "/privacy";
    router.push(newUrl);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
      title={currentLang === "en" ? "Switch to Finnish" : "Switch to English"}
    >
      <Globe size={16} />
      {currentLang === "en" ? "FI" : "EN"}
    </button>
  );
}

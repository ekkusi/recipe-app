import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-border bg-muted/30 py-6 text-sm text-muted-foreground">
      <div className="max-w-lg mx-auto px-4 flex gap-4 justify-center">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          {t("privacy") || "Privacy"}
        </Link>
      </div>
    </footer>
  );
}

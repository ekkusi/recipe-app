import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";

export default async function SettingsPage() {
  const user = await currentUser();
  const t = await getTranslations("settings");
  const tDelete = await getTranslations("deleteAccount");

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="pt-8 pb-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Account section */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <h2 className="text-lg font-bold mb-4">{t("account")}</h2>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("email")}</p>
          <p className="text-foreground font-medium">{email}</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-destructive/10 rounded-3xl p-6 border border-destructive/20">
        <div className="flex gap-3 items-start mb-4">
          <AlertTriangle
            size={20}
            className="text-destructive flex-shrink-0 mt-0.5"
          />
          <div>
            <h3 className="text-base font-bold text-destructive mb-2">
              {tDelete("title")}
            </h3>
            <p className="text-sm text-foreground mb-4">
              {tDelete("warning")}
            </p>
            <Link
              href="/settings/delete-account"
              className="text-destructive font-semibold text-sm hover:underline"
            >
              {t("deleteAccount")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

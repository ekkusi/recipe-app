import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DeleteAccountForm from "./delete-account-form";

export default async function DeleteAccountPage() {
  const user = await currentUser();
  const t = await getTranslations("deleteAccount");

  if (!user) {
    notFound();
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="pt-8 pb-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {/* Warning section */}
      <div className="bg-destructive/5 rounded-3xl p-6 mb-8 border border-destructive/20">
        <p className="text-foreground font-semibold mb-4">{t("warning")}</p>
        <p className="text-sm text-foreground mb-4">{t("whatGetsDeleted")}</p>
        <ul className="text-sm text-foreground space-y-2 ml-4">
          <li>• {t("item_recipes")}</li>
          <li>• {t("item_collections")}</li>
          <li>• {t("item_shoppingLists")}</li>
        </ul>
      </div>

      {/* Form */}
      <DeleteAccountForm userEmail={email} />
    </div>
  );
}

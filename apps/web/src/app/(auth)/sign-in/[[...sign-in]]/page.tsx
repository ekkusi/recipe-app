import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { CheckCircle } from "lucide-react";

interface SignInPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const isDeleted = params.deleted === "1";
  const t = await getTranslations("deleteAccount");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        {isDeleted && (
          <div className="mb-6 flex gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">{t("deleted")}</p>
          </div>
        )}
        <SignIn />
      </div>
    </div>
  );
}

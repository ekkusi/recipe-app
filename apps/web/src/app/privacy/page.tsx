import Link from "next/link";
import PrivacyPageClient from "./privacy-page-client";
import fiMessages from "@/messages/fi.json";
import enMessages from "@/messages/en.json";

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "fi";
  const messages = lang === "en" ? enMessages : fiMessages;
  const t = messages.privacy;
  const tCommon = messages.common;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-primary hover:underline text-sm">
            {tCommon.back}
          </Link>
          <PrivacyPageClient currentLang={lang as "en" | "fi"} />
        </div>

        <h1 className="text-4xl font-bold mb-8 text-foreground">{t.title}</h1>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">
            {t.lastUpdated}: {t.lastUpdatedDate}
          </p>

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.introduction.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.introduction.content}
            </p>
          </section>

          {/* What Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.dataCollected.title}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold">
                  {t.section.dataCollected.authentication.title}
                </h3>
                <p className="text-muted-foreground">
                  {t.section.dataCollected.authentication.content}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">
                  {t.section.dataCollected.recipes.title}
                </h3>
                <p className="text-muted-foreground">
                  {t.section.dataCollected.recipes.content}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">
                  {t.section.dataCollected.shoppingLists.title}
                </h3>
                <p className="text-muted-foreground">
                  {t.section.dataCollected.shoppingLists.content}
                </p>
              </div>
            </div>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.legalBasis.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.legalBasis.content}
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.thirdParty.title}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold">Clerk</h3>
                <p className="text-muted-foreground">
                  {t.section.thirdParty.clerk}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Supabase</h3>
                <p className="text-muted-foreground">
                  {t.section.thirdParty.supabase}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">
                  {t.section.thirdParty.future.title}
                </h3>
                <p className="text-muted-foreground">
                  {t.section.thirdParty.future.content}
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.retention.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.retention.content}
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.rights.title}
            </h2>
            <div className="space-y-2 text-sm list-disc list-inside">
              <p>• {t.section.rights.access}</p>
              <p>• {t.section.rights.rectification}</p>
              <p>• {t.section.rights.erasure}</p>
              <p>• {t.section.rights.restriction}</p>
              <p>• {t.section.rights.portability}</p>
              <p>• {t.section.rights.objection}</p>
            </div>
          </section>

          {/* How to Exercise Rights */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.exerciseRights.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.exerciseRights.content}
            </p>
            <p className="text-sm mt-2">
              <strong>{t.section.exerciseRights.email}:</strong> ekku.eki@gmail.com
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.security.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.security.content}
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.changes.title}
            </h2>
            <p className="text-sm leading-relaxed">
              {t.section.changes.content}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">
              {t.section.contact.title}
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <strong>{t.section.contact.name}:</strong> Ekku Sipilä
              </p>
              <p>
                <strong>{t.section.contact.email}:</strong> ekku.eki@gmail.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

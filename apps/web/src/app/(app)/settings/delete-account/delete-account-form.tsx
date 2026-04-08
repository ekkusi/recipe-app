"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

interface DeleteAccountFormProps {
  userEmail: string;
}

export default function DeleteAccountForm({
  userEmail,
}: DeleteAccountFormProps) {
  const router = useRouter();
  const t = useTranslations("deleteAccount");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const isValid = email === userEmail && confirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setStatus("error");
        setError(t("error"));
        return;
      }

      // Full page reload to clear session and redirect
      // Using window.location ensures the session cookie is cleared
      window.location.href = "/sign-in?deleted=1";
    } catch (err) {
      setStatus("error");
      setError(t("error"));
      console.error("Error deleting account:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email confirmation input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          {t("confirmEmail")}
        </label>
        <input
          id="email"
          type="text"
          placeholder={userEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {email === userEmail
            ? "✓ Sähköpostiosoite vastaa"
            : "Kirjoita tarkasti sähköpostiosoitteesi"}
        </p>
      </div>

      {/* Confirmation checkbox */}
      <div className="flex gap-3">
        <input
          id="confirm-check"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-5 h-5 rounded border-2 border-border cursor-pointer mt-0.5"
        />
        <label htmlFor="confirm-check" className="text-sm cursor-pointer">
          {t("confirmCheck")}
        </label>
      </div>

      {/* Error message */}
      {status === "error" && (
        <div className="flex gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle
            size={18}
            className="text-destructive flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid || status === "loading"}
        className="w-full px-4 py-3 rounded-2xl font-semibold text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

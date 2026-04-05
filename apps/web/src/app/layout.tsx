import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Reseptisovellus",
  description: "Oma resepti- ja ostoslistasovellus",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reseptisovellus",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang="fi" className={`${nunito.variable} h-full`}>
        <body className="min-h-full flex flex-col font-nunito antialiased bg-cream">
          <NextIntlClientProvider locale="fi" messages={messages}>
            <PwaRegister />
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

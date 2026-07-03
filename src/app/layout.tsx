import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advisory Lab — IA pour conseiller financier",
  description:
    "Outil de démonstration : analyse de portefeuille et de sociétés assistée par IA (DeepSeek + EODHD).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-ink-3 py-4 text-center text-xs text-fg-3">
          Advisory Lab — démonstration pédagogique HEG · données EODHD · analyse DeepSeek ·
          aucune recommandation d&apos;investissement réelle
        </footer>
      </body>
    </html>
  );
}

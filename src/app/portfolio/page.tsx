"use client";

// Page portefeuille : import PDF (extraction IA), portefeuille de démo,
// tableau des positions et profil d'investisseur.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { DEMO_PORTFOLIO } from "@/lib/demo-portfolio";
import { fmtCHF, storage } from "@/lib/storage";
import type { ExtractionResult, Portfolio, UnderTheHoodMeta } from "@/lib/types";
import { ASSET_CLASS_LABELS } from "@/lib/palette";
import { UnderTheHood } from "@/components/UnderTheHood";
import { ProfileForm } from "@/components/ProfileForm";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extractionMeta, setExtractionMeta] = useState<UnderTheHoodMeta | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortfolio(storage.getPortfolio());
  }, []);

  function adopt(p: Portfolio) {
    storage.setPortfolio(p);
    storage.clearAnalysis(); // une nouvelle base invalide l'ancienne analyse
    setPortfolio(p);
  }

  async function onFile(file: File) {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setExtractionMeta(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/portfolio/extract", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'extraction");
      const result = json as ExtractionResult;
      adopt(result.portfolio);
      setWarnings(result.warnings);
      setExtractionMeta(result._meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const total = portfolio?.positions.reduce((s, p) => s + p.value, 0) ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-fg-0">Portefeuille client</h1>
        <p className="text-sm text-fg-2 mt-1">
          Chargez un relevé PDF — l&apos;IA en extrait les positions — ou utilisez le
          portefeuille de démonstration.
        </p>
      </header>

      {/* Zone de chargement */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
        <button
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          className="flex-1 border-2 border-dashed border-ink-4 hover:border-sage-dim rounded-xl p-6 text-left transition-colors disabled:opacity-60"
        >
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-2 font-medium text-fg-0">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-sage" aria-hidden />
            ) : (
              <FileUp className="w-5 h-5 text-sage" aria-hidden />
            )}
            {loading ? "Extraction IA en cours…" : "Importer un relevé PDF"}
          </div>
          <p className="text-sm text-fg-2 mt-1.5">
            PDF textuel (relevé bancaire numérique). Le texte est extrait côté serveur puis
            structuré par DeepSeek.
          </p>
        </button>
        <a
          href="/releve-demo.pdf"
          download
          className="mt-2 text-xs text-sage hover:text-sage-bright underline underline-offset-2 self-start"
        >
          Télécharger un relevé PDF d&apos;exemple
        </a>
        </div>

        <button
          onClick={() => {
            adopt({ ...DEMO_PORTFOLIO, updatedAt: new Date().toISOString() });
            setWarnings([]);
            setExtractionMeta(null);
            setError(null);
          }}
          className="border border-ink-3 bg-ink-2 hover:border-sage-dim rounded-xl p-6 text-left transition-colors"
        >
          <div className="flex items-center gap-2 font-medium text-fg-0">
            <Sparkles className="w-5 h-5 text-sage" aria-hidden />
            Charger le portefeuille de démonstration
          </div>
          <p className="text-sm text-fg-2 mt-1.5">
            « M. Dupont » — 10 positions, ~{fmtCHF(802216)} CHF, volontairement
            imparfait (concentration, biais domestique) pour nourrir l&apos;analyse.
          </p>
        </button>
      </div>

      {error && (
        <div className="border border-negative/40 bg-negative/10 text-negative rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="border border-chart-5/40 bg-chart-5/10 rounded-lg px-4 py-3 text-sm text-fg-1">
          <strong className="text-fg-0">Avertissements d&apos;extraction :</strong>
          <ul className="list-disc ml-5 mt-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {extractionMeta && <UnderTheHood meta={extractionMeta} />}

      {/* Tableau des positions */}
      {portfolio && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-medium text-fg-0">{portfolio.name}</h2>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-fg-1">
                Total : {fmtCHF(total)} {portfolio.referenceCurrency}
              </span>
              <button
                onClick={() => {
                  storage.clearPortfolio();
                  storage.clearAnalysis();
                  setPortfolio(null);
                }}
                className="text-fg-3 hover:text-negative transition-colors"
                title="Supprimer le portefeuille"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-ink-3 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-2 text-left text-xs uppercase tracking-wide text-fg-3">
                  <th className="px-4 py-2.5">Instrument</th>
                  <th className="px-4 py-2.5">Classe</th>
                  <th className="px-4 py-2.5 text-right">Quantité</th>
                  <th className="px-4 py-2.5 text-right">Prix</th>
                  <th className="px-4 py-2.5">Devise</th>
                  <th className="px-4 py-2.5 text-right">Valeur (CHF)</th>
                  <th className="px-4 py-2.5 text-right">Poids</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p) => (
                  <tr key={p.id} className="border-t border-ink-3 hover:bg-ink-2/60">
                    <td className="px-4 py-2.5">
                      <div className="text-fg-0">{p.name}</div>
                      <div className="font-mono text-xs text-fg-3">{p.ticker || "—"}</div>
                    </td>
                    <td className="px-4 py-2.5 text-fg-1">
                      {ASSET_CLASS_LABELS[p.assetClass] ?? p.assetClass}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-fg-1">
                      {p.quantity.toLocaleString("fr-CH")}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-fg-1">
                      {p.price.toLocaleString("fr-CH")}
                    </td>
                    <td className="px-4 py-2.5 text-fg-1">{p.currency}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-fg-0">
                      {fmtCHF(p.value)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-fg-1">
                      {total ? ((p.value / total) * 100).toFixed(1) : "0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Profil investisseur */}
      <ProfileForm />

      {portfolio && (
        <div className="flex justify-end">
          <Link
            href="/portfolio/analyse"
            className="inline-flex items-center gap-2 bg-sage text-ink-0 font-medium px-5 py-2.5 rounded-lg hover:bg-sage-bright transition-colors"
          >
            Lancer l&apos;analyse des avoirs
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

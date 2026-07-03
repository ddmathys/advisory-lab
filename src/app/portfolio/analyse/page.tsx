"use client";

// Analyse des avoirs : calculs de répartition côté client (graphiques) +
// analyse qualitative par l'agent IA « spécialiste en investissement ».

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AllocationDonut, ConcentrationBars, type Slice } from "@/components/Charts";
import { UnderTheHood } from "@/components/UnderTheHood";
import { ASSET_CLASS_LABELS } from "@/lib/palette";
import { storage } from "@/lib/storage";
import type { InvestorProfile, Portfolio, PortfolioAnalysis } from "@/lib/types";

export default function AnalysePage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPortfolio(storage.getPortfolio());
    setProfile(storage.getProfile());
    setAnalysis(storage.getAnalysis());
    setHydrated(true);
  }, []);

  const total = useMemo(
    () => portfolio?.positions.reduce((s, p) => s + p.value, 0) ?? 0,
    [portfolio]
  );

  // Répartitions calculées localement (l'IA n'invente pas ces chiffres)
  const byClass: Slice[] = useMemo(() => {
    if (!portfolio) return [];
    const map = new Map<string, number>();
    for (const p of portfolio.positions) {
      const label = ASSET_CLASS_LABELS[p.assetClass] ?? p.assetClass;
      map.set(label, (map.get(label) ?? 0) + p.value);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const byCurrency: Slice[] = useMemo(() => {
    if (!portfolio) return [];
    const map = new Map<string, number>();
    for (const p of portfolio.positions) {
      map.set(p.currency, (map.get(p.currency) ?? 0) + p.value);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const bySector: Slice[] = useMemo(() => {
    if (!portfolio || !analysis) return [];
    const map = new Map<string, number>();
    for (const p of portfolio.positions) {
      const sector =
        analysis.secteursEstimes[p.ticker] ??
        (p.assetClass === "cash" ? "Liquidités" : "Non classé");
      map.set(sector, (map.get(sector) ?? 0) + p.value);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [portfolio, analysis]);

  const concentration = useMemo(() => {
    if (!portfolio || !total) return [];
    return portfolio.positions.map((p) => ({
      name: p.ticker || p.name.slice(0, 14),
      percent: (p.value / total) * 100,
    }));
  }, [portfolio, total]);

  async function runAnalysis() {
    if (!portfolio) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: portfolio.positions, profile }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'analyse");
      const result = json as PortfolioAnalysis;
      storage.setAnalysis(result);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  if (!portfolio) {
    return (
      <div className="text-center py-24">
        <p className="text-fg-2">Aucun portefeuille chargé.</p>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 mt-4 text-sage hover:text-sage-bright"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Charger un portefeuille
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg-0">Analyse des avoirs</h1>
          <p className="text-sm text-fg-2 mt-1">
            {portfolio.name} · {portfolio.positions.length} positions ·{" "}
            {profile
              ? `profil ${profile.computed}`
              : "aucun profil saisi (analyse générique)"}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-sage text-ink-0 font-medium px-4 py-2 rounded-lg hover:bg-sage-bright transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : analysis ? (
            <RefreshCw className="w-4 h-4" aria-hidden />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden />
          )}
          {loading
            ? "Analyse IA en cours…"
            : analysis
              ? "Relancer l'analyse IA"
              : "Lancer l'analyse IA"}
        </button>
      </header>

      {error && (
        <div className="border border-negative/40 bg-negative/10 text-negative rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Graphiques factuels (calculés localement) */}
      <section className="grid sm:grid-cols-2 gap-4">
        <AllocationDonut data={byClass} title="Répartition par classe d'actifs" />
        <AllocationDonut data={byCurrency} title="Répartition par devise" />
      </section>
      <ConcentrationBars data={concentration} title="Concentration par position" />

      {/* Résultats de l'agent IA */}
      {analysis && (
        <>
          <section className="grid sm:grid-cols-3 gap-4">
            <ScoreTile label="Diversification" value={analysis.scores.diversification} />
            <ScoreTile
              label="Adéquation au profil"
              value={analysis.scores.adequationProfil}
            />
            <ScoreTile label="Qualité globale" value={analysis.scores.qualite} />
          </section>

          {bySector.length > 0 && (
            <AllocationDonut
              data={bySector}
              title="Répartition sectorielle (secteurs estimés par l'IA)"
            />
          )}

          <section className="bg-ink-2 border border-ink-3 rounded-xl p-5 space-y-5">
            <div>
              <h3 className="font-medium text-fg-0 mb-1.5">Synthèse exécutive</h3>
              <p className="text-sm text-fg-1">{analysis.syntheseExecutive}</p>
            </div>

            <div>
              <h3 className="font-medium text-fg-0 mb-1.5">Concentration</h3>
              <p className="text-sm text-fg-1">{analysis.concentration.commentaire}</p>
              {analysis.concentration.alertes.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {analysis.concentration.alertes.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-fg-1">
                      <AlertTriangle
                        className="w-4 h-4 text-negative shrink-0 mt-0.5"
                        aria-hidden
                      />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <h3 className="font-medium text-fg-0 mb-1.5">Points forts</h3>
                <ul className="space-y-1.5">
                  {analysis.pointsForts.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-fg-1">
                      <CheckCircle2
                        className="w-4 h-4 text-positive shrink-0 mt-0.5"
                        aria-hidden
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-fg-0 mb-1.5">Risques identifiés</h3>
                <ul className="space-y-1.5">
                  {analysis.risques.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-fg-1">
                      <AlertTriangle
                        className="w-4 h-4 text-negative shrink-0 mt-0.5"
                        aria-hidden
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-fg-0 mb-1.5">Adéquation au profil</h3>
              <p className="text-sm text-fg-1">{analysis.adequationProfilCommentaire}</p>
            </div>

            <div>
              <h3 className="font-medium text-fg-0 mb-2">Recommandations</h3>
              <ul className="space-y-2">
                {analysis.recommandations.map((r) => (
                  <li key={r.texte} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                        r.priorite === "haute"
                          ? "bg-negative/20 text-negative"
                          : r.priorite === "moyenne"
                            ? "bg-chart-5/20 text-chart-5"
                            : "bg-ink-4 text-fg-2"
                      }`}
                    >
                      {r.priorite}
                    </span>
                    <span className="text-fg-1">{r.texte}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <UnderTheHood meta={analysis._meta} />
        </>
      )}

      {!analysis && !loading && (
        <p className="text-sm text-fg-3 text-center py-6">
          Les graphiques ci-dessus sont calculés localement. Lancez l&apos;analyse IA pour
          obtenir la lecture du spécialiste en investissement.
        </p>
      )}
    </div>
  );
}

/** Tuile de score 0-100 avec jauge fine */
function ScoreTile({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-4">
      <div className="text-xs text-fg-2">{label}</div>
      <div className="mt-1 font-mono text-3xl text-fg-0">
        {clamped}
        <span className="text-sm text-fg-3"> / 100</span>
      </div>
      <div
        className="mt-3 h-1.5 bg-ink-4 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full bg-sage rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

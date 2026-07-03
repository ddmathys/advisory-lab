"use client";

// Fiche asset : cotation, historique 1 an, fondamentaux et consensus EODHD,
// puis note d'analyse top-down rédigée par l'agent IA « analyste ».

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Minus,
  PlusCircle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { PriceChart } from "@/components/Charts";
import { UnderTheHood } from "@/components/UnderTheHood";
import { storage } from "@/lib/storage";
import type { AssetAnalysis, AssetDetail } from "@/lib/types";

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: rawTicker } = use(params);
  const ticker = decodeURIComponent(rawTicker);

  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [addedToSim, setAddedToSim] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/assets/detail?ticker=${encodeURIComponent(ticker)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur de chargement");
        if (!cancelled) setDetail(json as AssetDetail);
      } catch (e) {
        if (!cancelled)
          setDetailError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/assets/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, name: detail?.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'analyse");
      setAnalysis(json as AssetAnalysis);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setAnalyzing(false);
    }
  }

  function addToSimulation() {
    const sim = storage.getSimulation() ?? [];
    if (!sim.some((l) => l.ticker === ticker)) {
      sim.push({
        ticker,
        name: detail?.name ?? ticker,
        assetClass: "action",
        weightPercent: 5,
        currency: detail?.currency ?? "",
      });
      storage.setSimulation(sim);
    }
    setAddedToSim(true);
  }

  if (detailError) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-negative text-sm">{detailError}</p>
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-sage hover:text-sage-bright"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Retour à la recherche
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center py-24 text-fg-2 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-sage" aria-hidden />
        Chargement des données EODHD…
      </div>
    );
  }

  const h = detail.highlights ?? {};
  const v = detail.valuation ?? {};
  const ar = detail.analystRatings;
  const totalRatings = ar
    ? (ar.strongBuy ?? 0) + (ar.buy ?? 0) + (ar.hold ?? 0) + (ar.sell ?? 0) + (ar.strongSell ?? 0)
    : 0;

  return (
    <div className="space-y-8">
      <Link
        href="/assets"
        className="inline-flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg-0"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Recherche
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg-0">{detail.name}</h1>
          <p className="font-mono text-sm text-fg-2 mt-1">
            {detail.ticker}
            {detail.sector ? ` · ${detail.sector}` : ""}
            {detail.industry ? ` · ${detail.industry}` : ""}
          </p>
        </div>
        <div className="text-right">
          {detail.price != null && (
            <div className="font-mono text-3xl text-fg-0">
              {detail.price.toLocaleString("fr-CH")}{" "}
              <span className="text-sm text-fg-2">{detail.currency}</span>
            </div>
          )}
          {detail.changePercent != null && (
            <div
              className={`font-mono text-sm ${
                detail.changePercent >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {detail.changePercent >= 0 ? "+" : ""}
              {detail.changePercent.toFixed(2)}%
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-2 bg-sage text-ink-0 font-medium px-4 py-2 rounded-lg hover:bg-sage-bright transition-colors disabled:opacity-60"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden />
          )}
          {analyzing ? "Analyse top-down en cours…" : "Analyse top-down IA"}
        </button>
        <button
          onClick={addToSimulation}
          disabled={addedToSim}
          className="inline-flex items-center gap-2 border border-ink-4 text-fg-1 px-4 py-2 rounded-lg hover:border-sage-dim transition-colors disabled:opacity-60"
        >
          <PlusCircle className="w-4 h-4 text-sage" aria-hidden />
          {addedToSim ? "Ajouté à la simulation ✓" : "Ajouter à la simulation"}
        </button>
      </div>

      {detail.history.length > 0 && (
        <PriceChart
          data={detail.history}
          title={`${detail.ticker} — clôtures ajustées, 12 mois`}
          currency={detail.currency}
        />
      )}

      {/* Fondamentaux clés */}
      {detail.highlights && (
        <section>
          <h2 className="text-lg font-medium text-fg-0 mb-3">Fondamentaux (EODHD)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Capitalisation" value={fmtBig(h.MarketCapitalization)} />
            <Metric label="PER" value={fmtNum(h.PERatio)} />
            <Metric label="PER prospectif" value={fmtNum(v.ForwardPE)} />
            <Metric label="EV/EBITDA" value={fmtNum(v.EnterpriseValueEbitda)} />
            <Metric label="Marge nette" value={fmtPct(h.ProfitMargin)} />
            <Metric label="ROE (TTM)" value={fmtPct(h.ReturnOnEquityTTM)} />
            <Metric label="Rendement dividende" value={fmtPct(h.DividendYield)} />
            <Metric label="Croiss. CA (yoy)" value={fmtPct(h.QuarterlyRevenueGrowthYOY)} />
          </div>
        </section>
      )}

      {/* Consensus analystes */}
      {ar && totalRatings > 0 && (
        <section>
          <h2 className="text-lg font-medium text-fg-0 mb-3">
            Consensus des analystes (EODHD)
          </h2>
          <div className="bg-ink-2 border border-ink-3 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-xs text-fg-2">Note moyenne</div>
                <div className="font-mono text-2xl text-fg-0">
                  {ar.rating?.toFixed(2) ?? "—"}
                  <span className="text-sm text-fg-3"> / 5</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-fg-2">Objectif de cours</div>
                <div className="font-mono text-2xl text-fg-0">
                  {ar.targetPrice?.toLocaleString("fr-CH") ?? "—"}
                  <span className="text-sm text-fg-3"> {detail.currency}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-fg-2">Nombre d&apos;avis</div>
                <div className="font-mono text-2xl text-fg-0">{totalRatings}</div>
              </div>
            </div>
            {/* Barre empilée de répartition des avis (spacers 2px couleur surface) */}
            <div>
              <div
                className="flex h-3 rounded-full overflow-hidden"
                role="img"
                aria-label="Répartition des recommandations analystes"
              >
                {[
                  { n: ar.strongBuy ?? 0, color: "#61a159" },
                  { n: ar.buy ?? 0, color: "#26a69a" },
                  { n: ar.hold ?? 0, color: "#b8863b" },
                  { n: ar.sell ?? 0, color: "#c96f58" },
                  { n: ar.strongSell ?? 0, color: "#9678c8" },
                ]
                  .filter((s) => s.n > 0)
                  .map((s, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${(s.n / totalRatings) * 100}%`,
                        backgroundColor: s.color,
                        borderRight: "2px solid #15181c",
                      }}
                    />
                  ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-fg-1">
                <LegendDot color="#61a159" label={`Achat fort ${ar.strongBuy ?? 0}`} />
                <LegendDot color="#26a69a" label={`Achat ${ar.buy ?? 0}`} />
                <LegendDot color="#b8863b" label={`Conserver ${ar.hold ?? 0}`} />
                <LegendDot color="#c96f58" label={`Vendre ${ar.sell ?? 0}`} />
                <LegendDot color="#9678c8" label={`Vente forte ${ar.strongSell ?? 0}`} />
              </div>
            </div>
          </div>
        </section>
      )}

      {detail.description && (
        <p className="text-sm text-fg-2 leading-relaxed">{detail.description}…</p>
      )}

      <UnderTheHood meta={detail._meta} />

      {analysisError && (
        <div className="border border-negative/40 bg-negative/10 text-negative rounded-lg px-4 py-3 text-sm">
          {analysisError}
        </div>
      )}

      {/* Note d'analyse de l'agent IA */}
      {analysis && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-fg-0">
            Note d&apos;analyse top-down (agent IA)
          </h2>

          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-4 border ${
              analysis.conclusion.avis === "positif"
                ? "border-positive/40 bg-positive/10"
                : analysis.conclusion.avis === "negatif"
                  ? "border-negative/40 bg-negative/10"
                  : "border-ink-4 bg-ink-2"
            }`}
          >
            {analysis.conclusion.avis === "positif" ? (
              <ThumbsUp className="w-5 h-5 text-positive shrink-0" aria-hidden />
            ) : analysis.conclusion.avis === "negatif" ? (
              <ThumbsDown className="w-5 h-5 text-negative shrink-0" aria-hidden />
            ) : (
              <Minus className="w-5 h-5 text-fg-2 shrink-0" aria-hidden />
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-fg-2">
                Avis : {analysis.conclusion.avis}
              </div>
              <p className="text-sm text-fg-0 mt-0.5">{analysis.conclusion.texte}</p>
            </div>
          </div>

          <div className="bg-ink-2 border border-ink-3 rounded-xl p-5 space-y-5">
            <Block title="1 · Contexte macro" text={analysis.macro} />
            <Block title="2 · Secteur" text={analysis.secteur} />
            <Block title="3 · Société" text={analysis.societe} />

            <div>
              <h3 className="font-medium text-fg-0 mb-2">Indicateurs clés</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-fg-3">
                      <th className="py-1.5 pr-4">Indicateur</th>
                      <th className="py-1.5 pr-4">Valeur</th>
                      <th className="py-1.5">Lecture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.indicateurs.map((i) => (
                      <tr key={i.nom} className="border-t border-ink-3">
                        <td className="py-2 pr-4 text-fg-1">{i.nom}</td>
                        <td className="py-2 pr-4 font-mono text-fg-0">{i.valeur}</td>
                        <td className="py-2 text-fg-2">{i.lecture}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Block title="Lecture du consensus" text={analysis.consensusCommentaire} />
            <Block title="Thèse d'investissement" text={analysis.theseInvestissement} />

            <div>
              <h3 className="font-medium text-fg-0 mb-1.5">Risques</h3>
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

          <UnderTheHood meta={analysis._meta} />
        </section>
      )}
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-medium text-fg-0 mb-1.5">{title}</h3>
      <p className="text-sm text-fg-1 leading-relaxed">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-2 border border-ink-3 rounded-lg px-3 py-2.5">
      <div className="text-xs text-fg-3">{label}</div>
      <div className="font-mono text-fg-0 mt-0.5">{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/* Formatage des métriques EODHD */
function fmtNum(v: unknown): string {
  return typeof v === "number" && isFinite(v) ? v.toFixed(2) : "—";
}
function fmtPct(v: unknown): string {
  return typeof v === "number" && isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—";
}
function fmtBig(v: unknown): string {
  if (typeof v !== "number" || !isFinite(v)) return "—";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)} T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} Mrd`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1) } M`;
  return v.toLocaleString("fr-CH");
}

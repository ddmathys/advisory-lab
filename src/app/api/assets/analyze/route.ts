// POST /api/assets/analyze — note d'analyse top-down d'une société.
// Données factuelles en cascade : fondamentaux EODHD → repli Finnhub (US) →
// à défaut, cours + historique seuls (l'agent le signale dans sa note).

import { NextRequest, NextResponse } from "next/server";
import { deepseekJson } from "@/lib/deepseek";
import { eodHistory, fundamentals, realTimeQuote } from "@/lib/eodhd";
import { finnhubBundle, summarizeFinnhub } from "@/lib/finnhub";
import { summarizeFundamentals } from "@/lib/fundamentals-summary";
import { ASSET_ANALYST_SYSTEM, assetAnalystUser } from "@/lib/prompts";
import type { AssetAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { ticker, name } = (await req.json()) as { ticker: string; name?: string };
    if (!ticker) {
      return NextResponse.json({ error: "Ticker manquant." }, { status: 400 });
    }

    // 1) Données factuelles (le LLM ne doit pas inventer les chiffres)
    const [fundRes, quoteRes, historyRes] = await Promise.allSettled([
      fundamentals(ticker),
      realTimeQuote(ticker),
      eodHistory(ticker),
    ]);

    const price =
      quoteRes.status === "fulfilled" && quoteRes.value.close !== "NA"
        ? (quoteRes.value.close as number)
        : null;

    const sources: string[] = [`EODHD /real-time/${ticker}`];
    let summary: string;
    let displayName = name ?? ticker;

    if (fundRes.status === "fulfilled") {
      // Cas idéal : fondamentaux EODHD complets (consensus inclus)
      summary = summarizeFundamentals(fundRes.value, price);
      displayName =
        name ?? ((fundRes.value.General?.Name as string | undefined) || ticker);
      sources.push(`EODHD /fundamentals/${ticker}`);
    } else {
      // Repli Finnhub pour les titres US
      const finnhub = await finnhubBundle(ticker);
      if (finnhub) {
        summary = summarizeFinnhub(finnhub, price);
        displayName = name ?? finnhub.profile?.name ?? ticker;
        sources.push(`Finnhub metric/recommendation (repli, ${ticker})`);
      } else {
        // Dernier recours : cours et historique 1 an uniquement
        const history = historyRes.status === "fulfilled" ? historyRes.value : [];
        const first = history[0]?.close;
        const last = history[history.length - 1]?.close;
        const perf =
          first && last ? (((last - first) / first) * 100).toFixed(1) : null;
        summary = [
          `AVERTISSEMENT : aucun fondamental disponible pour ce titre (plan API limité).`,
          `Analyse à mener sur la base du cours, de l'historique et de tes connaissances générales`,
          `sur la société — signale explicitement cette limite dans ta note.`,
          price != null ? `Cours actuel : ${price}` : null,
          perf != null ? `Performance sur 12 mois : ${perf}%` : null,
          `Consensus analystes : non disponible.`,
        ]
          .filter(Boolean)
          .join("\n");
        if (history.length) sources.push(`EODHD /eod/${ticker} (1 an)`);
      }
    }

    // 2) Rédaction de la note par l'agent analyste
    const { data, meta } = await deepseekJson<Omit<AssetAnalysis, "_meta">>(
      ASSET_ANALYST_SYSTEM,
      assetAnalystUser(ticker, displayName, summary),
      sources
    );

    const analysis: AssetAnalysis = { ...data, _meta: meta };
    return NextResponse.json(analysis);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

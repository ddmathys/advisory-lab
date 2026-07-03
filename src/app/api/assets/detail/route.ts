// GET /api/assets/detail?ticker=NESN.SW — cotation, historique 1 an et
// fondamentaux via EODHD ; repli Finnhub (titres US) si le plan EODHD
// ne couvre pas /fundamentals.

import { NextRequest, NextResponse } from "next/server";
import { eodHistory, fundamentals, realTimeQuote } from "@/lib/eodhd";
import { extractAnalystRatings } from "@/lib/fundamentals-summary";
import { finnhubBundle, finnhubRating, finnhubToHighlights } from "@/lib/finnhub";
import type { AssetDetail } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

function n(v: unknown): number | null {
  return typeof v === "number" && isFinite(v) ? v : null;
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.trim();
  if (!ticker) {
    return NextResponse.json({ error: "Paramètre ticker manquant." }, { status: 400 });
  }

  const start = Date.now();
  const sources: string[] = [];

  try {
    // Les trois appels EODHD en parallèle ; fundamentals peut échouer selon le plan.
    const [quoteRes, historyRes, fundRes] = await Promise.allSettled([
      realTimeQuote(ticker),
      eodHistory(ticker),
      fundamentals(ticker),
    ]);

    const quote = quoteRes.status === "fulfilled" ? quoteRes.value : null;
    if (quote) sources.push(`EODHD /real-time/${ticker}`);
    const history = historyRes.status === "fulfilled" ? historyRes.value : [];
    if (history.length) sources.push(`EODHD /eod/${ticker} (1 an)`);
    const fund = fundRes.status === "fulfilled" ? fundRes.value : null;
    if (fund) sources.push(`EODHD /fundamentals/${ticker}`);

    // Repli Finnhub (gratuit, titres US) si les fondamentaux EODHD sont inaccessibles
    const finnhub = !fund ? await finnhubBundle(ticker) : null;
    if (finnhub) sources.push(`Finnhub profile2/metric/recommendation (repli, ${ticker})`);

    if (!quote && !history.length && !fund && !finnhub) {
      const firstError = [quoteRes, historyRes, fundRes].find(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      return NextResponse.json(
        { error: `Aucune donnée disponible pour ${ticker}. ${firstError?.reason ?? ""}` },
        { status: 502 }
      );
    }

    const general = (fund?.General ?? {}) as Record<string, unknown>;

    let analystRatings: AssetDetail["analystRatings"] = fund
      ? extractAnalystRatings(fund)
      : null;
    if (!analystRatings && finnhub?.recommendation) {
      const r = finnhub.recommendation;
      analystRatings = {
        rating: finnhubRating(r),
        strongBuy: r.strongBuy,
        buy: r.buy,
        hold: r.hold,
        sell: r.sell,
        strongSell: r.strongSell,
      };
    }

    const detail: AssetDetail = {
      ticker,
      name: (general.Name as string) ?? finnhub?.profile?.name ?? ticker,
      exchange: (general.Exchange as string) ?? ticker.split(".")[1] ?? "",
      currency:
        (general.CurrencyCode as string) ?? finnhub?.profile?.currency ?? "",
      price: quote && quote.close !== "NA" ? n(quote.close) : null,
      changePercent: quote && quote.change_p !== "NA" ? n(quote.change_p) : null,
      previousClose: quote && quote.previousClose !== "NA" ? n(quote.previousClose) : null,
      history: history.map((h) => ({ date: h.date, close: h.adjusted_close ?? h.close })),
      highlights:
        (fund?.Highlights as Record<string, unknown>) ??
        (finnhub ? finnhubToHighlights(finnhub) : null),
      valuation: (fund?.Valuation as Record<string, unknown>) ?? null,
      analystRatings,
      sector: (general.Sector as string | undefined) ?? undefined,
      industry:
        (general.Industry as string | undefined) ??
        finnhub?.profile?.finnhubIndustry ??
        undefined,
      description: (general.Description as string | undefined)?.slice(0, 800),
      _meta: {
        durationMs: Date.now() - start,
        dataSources: sources,
      },
    };

    return NextResponse.json(detail);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

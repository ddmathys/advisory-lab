// Client Finnhub — CÔTÉ SERVEUR UNIQUEMENT.
// Solution de repli gratuite pour les fondamentaux et le consensus analystes
// des titres US quand le plan EODHD ne couvre pas /fundamentals (HTTP 403).

const BASE = "https://finnhub.io/api/v1";

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}
const cache = new Map<string, CacheEntry>();

function token(): string | null {
  return process.env.FINNHUB_API_KEY ?? null;
}

/** Convertit un ticker EODHD "AAPL.US" en symbole Finnhub "AAPL" (US uniquement). */
export function toFinnhubSymbol(eodhTicker: string): string | null {
  const [code, exchange] = eodhTicker.split(".");
  if (!code || exchange !== "US") return null; // le plan gratuit Finnhub couvre les titres US
  return code;
}

async function finnhubFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = token();
  if (!key) return null;
  const search = new URLSearchParams({ ...params, token: key });
  const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;

  const res = await fetch(`${BASE}${path}?${search.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as T;
  cache.set(cacheKey, { expiresAt: Date.now() + 6 * 3600 * 1000, data });
  return data;
}

export interface FinnhubBundle {
  profile: {
    name?: string;
    finnhubIndustry?: string;
    country?: string;
    currency?: string;
    marketCapitalization?: number; // en millions
  } | null;
  metric: Record<string, number | string | null> | null;
  recommendation: {
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  } | null;
}

/** Récupère profil + métriques + dernière recommandation pour un ticker US. */
export async function finnhubBundle(eodhTicker: string): Promise<FinnhubBundle | null> {
  const symbol = toFinnhubSymbol(eodhTicker);
  if (!symbol || !token()) return null;

  const [profile, metricRes, recos] = await Promise.all([
    finnhubFetch<FinnhubBundle["profile"]>("/stock/profile2", { symbol }),
    finnhubFetch<{ metric: Record<string, number | string | null> }>("/stock/metric", {
      symbol,
      metric: "all",
    }),
    finnhubFetch<NonNullable<FinnhubBundle["recommendation"]>[]>("/stock/recommendation", {
      symbol,
    }),
  ]);

  const recommendation = Array.isArray(recos) && recos.length > 0 ? recos[0] : null;
  if (!profile && !metricRes && !recommendation) return null;

  return { profile, metric: metricRes?.metric ?? null, recommendation };
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}

/** Note moyenne pondérée 1–5 (5 = achat fort) à partir de la répartition des avis. */
export function finnhubRating(r: NonNullable<FinnhubBundle["recommendation"]>): number | undefined {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (!total) return undefined;
  return (5 * r.strongBuy + 4 * r.buy + 3 * r.hold + 2 * r.sell + 1 * r.strongSell) / total;
}

/**
 * Projette les métriques Finnhub sur le format « Highlights » EODHD utilisé par l'UI
 * (les pourcentages Finnhub sont en %, EODHD en décimales → division par 100).
 */
export function finnhubToHighlights(b: FinnhubBundle): Record<string, unknown> {
  const m = b.metric ?? {};
  const h: Record<string, unknown> = {};
  const cap = num(b.profile?.marketCapitalization);
  if (cap !== undefined) h.MarketCapitalization = cap * 1e6;
  if (num(m.peTTM) !== undefined) h.PERatio = m.peTTM;
  if (num(m.netProfitMarginTTM) !== undefined)
    h.ProfitMargin = (m.netProfitMarginTTM as number) / 100;
  if (num(m.roeTTM) !== undefined) h.ReturnOnEquityTTM = (m.roeTTM as number) / 100;
  if (num(m.dividendYieldIndicatedAnnual) !== undefined)
    h.DividendYield = (m.dividendYieldIndicatedAnnual as number) / 100;
  if (num(m.revenueGrowthQuarterlyYoy) !== undefined)
    h.QuarterlyRevenueGrowthYOY = (m.revenueGrowthQuarterlyYoy as number) / 100;
  if (num(m.epsTTM) !== undefined) h.EarningsShare = m.epsTTM;
  return h;
}

/** Résumé texte des données Finnhub pour le prompt de l'agent analyste. */
export function summarizeFinnhub(b: FinnhubBundle, currentPrice: number | null): string {
  const m = b.metric ?? {};
  const lines: string[] = [];
  lines.push(`(Source : Finnhub — repli gratuit, titres US)`);
  if (b.profile?.finnhubIndustry) lines.push(`Industrie : ${b.profile.finnhubIndustry}`);
  if (currentPrice != null) lines.push(`Cours actuel : ${currentPrice}`);
  if (num(b.profile?.marketCapitalization) !== undefined)
    lines.push(`Capitalisation : ${Math.round(b.profile!.marketCapitalization!)} M USD`);

  const picks: [string, string, string?][] = [
    ["PER (TTM)", "peTTM"],
    ["P/B", "pbAnnual"],
    ["P/S (TTM)", "psTTM"],
    ["BPA (TTM)", "epsTTM"],
    ["Marge nette (TTM)", "netProfitMarginTTM", "%"],
    ["Marge opérationnelle (TTM)", "operatingMarginTTM", "%"],
    ["ROE (TTM)", "roeTTM", "%"],
    ["ROA (TTM)", "roaTTM", "%"],
    ["Croissance CA (trim., yoy)", "revenueGrowthQuarterlyYoy", "%"],
    ["Croissance BPA (trim., yoy)", "epsGrowthQuarterlyYoy", "%"],
    ["Rendement dividende", "dividendYieldIndicatedAnnual", "%"],
    ["Dette/Fonds propres", "totalDebt/totalEquityAnnual"],
    ["Beta", "beta"],
    ["Perf 52 semaines", "52WeekPriceReturnDaily", "%"],
    ["Plus haut 52 sem.", "52WeekHigh"],
    ["Plus bas 52 sem.", "52WeekLow"],
  ];
  for (const [label, key, unit] of picks) {
    const v = num(m[key]);
    if (v !== undefined) lines.push(`${label} : ${v}${unit ?? ""}`);
  }

  if (b.recommendation) {
    const r = b.recommendation;
    lines.push(`--- Consensus analystes (Finnhub, période ${r.period}) ---`);
    lines.push(
      `StrongBuy ${r.strongBuy}, Buy ${r.buy}, Hold ${r.hold}, Sell ${r.sell}, StrongSell ${r.strongSell}`
    );
    const rating = finnhubRating(r);
    if (rating !== undefined) lines.push(`Note moyenne pondérée : ${rating.toFixed(2)} / 5 (5 = achat fort)`);
  }

  return lines.join("\n");
}

// Transforme les fondamentaux EODHD (objet volumineux) en un résumé texte
// compact destiné au prompt de l'agent analyste — et en extraits structurés pour l'UI.

type Fund = Record<string, Record<string, unknown>>;

function num(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

export interface AnalystRatingsExtract {
  rating?: number;
  targetPrice?: number;
  strongBuy?: number;
  buy?: number;
  hold?: number;
  sell?: number;
  strongSell?: number;
}

export function extractAnalystRatings(f: Fund): AnalystRatingsExtract | null {
  const ar = f.AnalystRatings as Record<string, unknown> | undefined;
  if (!ar) return null;
  return {
    rating: num(ar.Rating),
    targetPrice: num(ar.TargetPrice),
    strongBuy: num(ar.StrongBuy),
    buy: num(ar.Buy),
    hold: num(ar.Hold),
    sell: num(ar.Sell),
    strongSell: num(ar.StrongSell),
  };
}

/** Résumé texte des fondamentaux pour le prompt LLM (limité aux chiffres utiles). */
export function summarizeFundamentals(f: Fund, currentPrice: number | null): string {
  const g = f.General ?? {};
  const h = f.Highlights ?? {};
  const v = f.Valuation ?? {};
  const t = f.Technicals ?? {};
  const ar = extractAnalystRatings(f);

  const lines: string[] = [];
  lines.push(`Secteur : ${str(g.Sector) ?? "n/d"} | Industrie : ${str(g.Industry) ?? "n/d"}`);
  lines.push(`Pays : ${str(g.CountryName) ?? "n/d"} | Devise : ${str(g.CurrencyCode) ?? "n/d"}`);
  if (str(g.Description)) lines.push(`Description : ${(g.Description as string).slice(0, 500)}`);
  if (currentPrice != null) lines.push(`Cours actuel : ${currentPrice}`);

  lines.push(`--- Highlights ---`);
  const highlights: [string, unknown][] = [
    ["Capitalisation", h.MarketCapitalization],
    ["EBITDA", h.EBITDA],
    ["PER", h.PERatio],
    ["PEG", h.PEGRatio],
    ["BPA (EPS)", h.EarningsShare],
    ["Dividende (yield)", h.DividendYield],
    ["Marge bénéficiaire", h.ProfitMargin],
    ["Marge opérationnelle (TTM)", h.OperatingMarginTTM],
    ["ROE (TTM)", h.ReturnOnEquityTTM],
    ["ROA (TTM)", h.ReturnOnAssetsTTM],
    ["CA (TTM)", h.RevenueTTM],
    ["Croissance CA (yoy)", h.QuarterlyRevenueGrowthYOY],
    ["Croissance bénéfices (yoy)", h.QuarterlyEarningsGrowthYOY],
  ];
  for (const [label, val] of highlights) {
    if (num(val) !== undefined) lines.push(`${label} : ${val}`);
  }

  lines.push(`--- Valorisation ---`);
  const valuation: [string, unknown][] = [
    ["PER prospectif", v.ForwardPE],
    ["P/S (TTM)", v.PriceSalesTTM],
    ["P/B", v.PriceBookMRQ],
    ["EV/EBITDA", v.EnterpriseValueEbitda],
    ["EV/CA", v.EnterpriseValueRevenue],
  ];
  for (const [label, val] of valuation) {
    if (num(val) !== undefined) lines.push(`${label} : ${val}`);
  }

  if (num(t?.Beta) !== undefined) lines.push(`Beta : ${t.Beta}`);
  if (num(t?.["52WeekHigh"]) !== undefined)
    lines.push(`52 semaines : ${t["52WeekLow"]} – ${t["52WeekHigh"]}`);

  if (ar) {
    lines.push(`--- Consensus analystes (EODHD) ---`);
    lines.push(
      `Note moyenne : ${ar.rating ?? "n/d"} / 5 | Objectif de cours : ${ar.targetPrice ?? "n/d"}`
    );
    lines.push(
      `Répartition : StrongBuy ${ar.strongBuy ?? 0}, Buy ${ar.buy ?? 0}, Hold ${ar.hold ?? 0}, Sell ${ar.sell ?? 0}, StrongSell ${ar.strongSell ?? 0}`
    );
  } else {
    lines.push(`Consensus analystes : non disponible pour ce titre.`);
  }

  return lines.join("\n");
}

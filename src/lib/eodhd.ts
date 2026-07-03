// Client EODHD — CÔTÉ SERVEUR UNIQUEMENT (la clé ne doit jamais atteindre le navigateur).
// Cache mémoire avec TTL pour économiser le quota d'appels.

const BASE = "https://eodhd.com/api";

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

function apiToken(): string {
  const token = process.env.EOD_API_KEY;
  if (!token) throw new Error("EOD_API_KEY manquante dans .env.local");
  return token;
}

/** Appel EODHD avec cache (TTL en secondes). Retourne le JSON parsé. */
async function eodhFetch<T>(path: string, params: Record<string, string>, ttlSeconds: number): Promise<T> {
  const search = new URLSearchParams({ ...params, api_token: apiToken(), fmt: "json" });
  const url = `${BASE}${path}?${search.toString()}`;
  const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;

  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EODHD ${res.status} sur ${path} : ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as T;
  cache.set(cacheKey, { expiresAt: Date.now() + ttlSeconds * 1000, data });
  return data;
}

/** Recherche d'instruments (autocomplete) */
export async function searchAssets(query: string) {
  return eodhFetch<
    { Code: string; Exchange: string; Name: string; Type: string; Country: string; Currency: string }[]
  >(`/search/${encodeURIComponent(query)}`, { limit: "10" }, 3600);
}

/** Cotation temps réel (différée sur le plan de base) */
export async function realTimeQuote(ticker: string) {
  return eodhFetch<{
    code: string;
    close: number | "NA";
    previousClose: number | "NA";
    change_p: number | "NA";
    timestamp: number;
  }>(`/real-time/${encodeURIComponent(ticker)}`, {}, 300);
}

/** Historique de cours fin de journée (1 an par défaut) */
export async function eodHistory(ticker: string, fromISO?: string) {
  const from =
    fromISO ?? new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return eodhFetch<{ date: string; close: number; adjusted_close: number }[]>(
    `/eod/${encodeURIComponent(ticker)}`,
    { period: "d", from },
    6 * 3600
  );
}

/** Fondamentaux (Highlights, Valuation, AnalystRatings, General…) */
export async function fundamentals(ticker: string) {
  return eodhFetch<Record<string, Record<string, unknown>>>(
    `/fundamentals/${encodeURIComponent(ticker)}`,
    {},
    24 * 3600
  );
}

"use client";

// Recherche d'assets via EODHD (autocomplete debouncé) — porte d'entrée
// vers la fiche détaillée et l'analyse top-down.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";
import type { SearchResult } from "@/lib/types";

export default function AssetsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/assets/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur de recherche");
        setResults(json.results);
        setSearched(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold text-fg-0">Recherche d&apos;assets</h1>
        <p className="text-sm text-fg-2 mt-1">
          Recherchez une société, un ETF ou un fonds (données EODHD). Exemples :
          « Nestlé », « AAPL », « Vanguard All-World ».
        </p>
      </header>

      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-3"
          aria-hidden
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou ticker…"
          className="w-full bg-ink-2 border border-ink-4 rounded-xl pl-11 pr-11 py-3 text-fg-0 placeholder:text-fg-3 focus:outline-none focus:border-sage"
        />
        {loading && (
          <Loader2
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-sage animate-spin"
            aria-hidden
          />
        )}
      </div>

      {error && (
        <div className="border border-negative/40 bg-negative/10 text-negative rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ul className="border border-ink-3 rounded-xl divide-y divide-ink-3 overflow-hidden">
          {results.map((r) => (
            <li key={r.ticker}>
              <Link
                href={`/assets/${encodeURIComponent(r.ticker)}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-ink-2 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-fg-0 truncate">{r.name}</div>
                  <div className="font-mono text-xs text-fg-3">
                    {r.ticker} · {r.type} · {r.country}
                  </div>
                </div>
                <span className="font-mono text-xs text-fg-2">{r.currency}</span>
                <ArrowRight
                  className="w-4 h-4 text-fg-3 group-hover:text-sage transition-colors"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-fg-3 text-center py-8">
          Aucun résultat pour « {query} ».
        </p>
      )}
    </div>
  );
}

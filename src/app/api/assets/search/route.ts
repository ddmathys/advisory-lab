// GET /api/assets/search?q=... — recherche d'instruments via EODHD (autocomplete).

import { NextRequest, NextResponse } from "next/server";
import { searchAssets } from "@/lib/eodhd";
import type { SearchResult } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const raw = await searchAssets(q);
    const results: SearchResult[] = raw.map((r) => ({
      ticker: `${r.Code}.${r.Exchange}`,
      name: r.Name,
      exchange: r.Exchange,
      currency: r.Currency,
      type: r.Type,
      country: r.Country,
    }));
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

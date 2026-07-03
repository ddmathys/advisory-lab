// POST /api/portfolio/analyze — analyse du portefeuille par l'agent
// « spécialiste en investissement » (DeepSeek), en tenant compte du profil client.

import { NextRequest, NextResponse } from "next/server";
import { deepseekJson } from "@/lib/deepseek";
import { PORTFOLIO_ANALYST_SYSTEM, portfolioAnalystUser } from "@/lib/prompts";
import type { InvestorProfile, PortfolioAnalysis, Position } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      positions: Position[];
      profile: InvestorProfile | null;
    };

    if (!body.positions?.length) {
      return NextResponse.json({ error: "Aucune position fournie." }, { status: 400 });
    }

    const totalValue = body.positions.reduce((s, p) => s + p.value, 0);

    const { data, meta } = await deepseekJson<Omit<PortfolioAnalysis, "_meta">>(
      PORTFOLIO_ANALYST_SYSTEM,
      portfolioAnalystUser(body.positions, body.profile, totalValue),
      [`Portefeuille client (${body.positions.length} positions, calculs de poids côté serveur)`]
    );

    const analysis: PortfolioAnalysis = { ...data, _meta: meta };
    return NextResponse.json(analysis);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/portfolio/extract — reçoit un PDF, extrait le texte (unpdf),
// puis structure les positions via DeepSeek (agent extraction).

import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { deepseekJson } from "@/lib/deepseek";
import { EXTRACTION_SYSTEM, extractionUser } from "@/lib/prompts";
import type { AssetClass, ExtractionResult, Position } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExtractionJson {
  portfolioName?: string;
  referenceCurrency?: string;
  positions?: {
    ticker?: string;
    name?: string;
    assetClass?: string;
    quantity?: number | null;
    price?: number | null;
    currency?: string;
    value?: number | null;
  }[];
  warnings?: string[];
}

const VALID_CLASSES: AssetClass[] = [
  "action", "obligation", "fonds", "etf", "cash",
  "immobilier", "crypto", "matiere_premiere", "autre",
];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier PDF reçu." }, { status: 400 });
    }

    // 1) Extraction du texte du PDF
    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Le PDF ne contient pas de texte exploitable (probablement un scan). Utilisez un relevé généré numériquement.",
        },
        { status: 422 }
      );
    }

    // 2) Structuration par DeepSeek
    const { data, meta } = await deepseekJson<ExtractionJson>(
      EXTRACTION_SYSTEM,
      extractionUser(text),
      [`PDF « ${file.name} » (${totalPages} page(s), ${text.length} caractères extraits)`]
    );

    const warnings = [...(data.warnings ?? [])];
    const positions: Position[] = (data.positions ?? [])
      .filter((p) => p.name)
      .map((p, i) => {
        const assetClass = VALID_CLASSES.includes(p.assetClass as AssetClass)
          ? (p.assetClass as AssetClass)
          : "autre";
        const quantity = p.quantity ?? 1;
        const price = p.price ?? 0;
        const value = p.value ?? quantity * price;
        return {
          id: `pdf-${Date.now()}-${i}`,
          ticker: p.ticker ?? "",
          name: p.name ?? "Position inconnue",
          assetClass,
          quantity,
          price,
          currency: p.currency ?? data.referenceCurrency ?? "CHF",
          value,
        };
      });

    if (positions.length === 0) {
      return NextResponse.json(
        { error: "Aucune position identifiée dans ce document.", warnings },
        { status: 422 }
      );
    }

    const result: ExtractionResult = {
      portfolio: {
        name: data.portfolioName || file.name.replace(/\.pdf$/i, ""),
        referenceCurrency: data.referenceCurrency || "CHF",
        positions,
        updatedAt: new Date().toISOString(),
        source: "pdf",
      },
      warnings,
      _meta: meta,
    };

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

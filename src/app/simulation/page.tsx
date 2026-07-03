"use client";

// Portefeuille simulé : allocation cible construite à partir des assets analysés,
// comparée au portefeuille actuel du client (par classe d'actifs).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle, Scale, Search, Trash2 } from "lucide-react";
import { ComparisonBars } from "@/components/Charts";
import { ASSET_CLASS_LABELS } from "@/lib/palette";
import { storage } from "@/lib/storage";
import type { AssetClass, Portfolio, SimulatedLine } from "@/lib/types";

const CLASS_OPTIONS = Object.entries(ASSET_CLASS_LABELS) as [AssetClass, string][];

export default function SimulationPage() {
  const [lines, setLines] = useState<SimulatedLine[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(storage.getSimulation() ?? []);
    setPortfolio(storage.getPortfolio());
    setHydrated(true);
  }, []);

  function persist(next: SimulatedLine[]) {
    setLines(next);
    storage.setSimulation(next);
  }

  function updateLine(i: number, patch: Partial<SimulatedLine>) {
    persist(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  function addCashLine() {
    persist([
      ...lines,
      {
        ticker: "CASH.CHF",
        name: "Liquidités CHF",
        assetClass: "cash",
        weightPercent: 5,
        currency: "CHF",
      },
    ]);
  }

  function normalize() {
    const total = lines.reduce((s, l) => s + l.weightPercent, 0);
    if (total <= 0) return;
    persist(
      lines.map((l) => ({
        ...l,
        weightPercent: Math.round((l.weightPercent / total) * 1000) / 10,
      }))
    );
  }

  const totalWeight = useMemo(
    () => lines.reduce((s, l) => s + l.weightPercent, 0),
    [lines]
  );

  // Comparaison par classe d'actifs : actuel (valeurs) vs simulé (poids)
  const comparison = useMemo(() => {
    const actual = new Map<string, number>();
    const totalValue = portfolio?.positions.reduce((s, p) => s + p.value, 0) ?? 0;
    if (portfolio && totalValue > 0) {
      for (const p of portfolio.positions) {
        const label = ASSET_CLASS_LABELS[p.assetClass] ?? p.assetClass;
        actual.set(label, (actual.get(label) ?? 0) + (p.value / totalValue) * 100);
      }
    }
    const simulated = new Map<string, number>();
    const weightSum = totalWeight || 1;
    for (const l of lines) {
      const label = ASSET_CLASS_LABELS[l.assetClass] ?? l.assetClass;
      simulated.set(label, (simulated.get(label) ?? 0) + (l.weightPercent / weightSum) * 100);
    }
    const allLabels = new Set([...actual.keys(), ...simulated.keys()]);
    return [...allLabels].map((name) => ({
      name,
      actuel: Math.round((actual.get(name) ?? 0) * 10) / 10,
      simule: Math.round((simulated.get(name) ?? 0) * 10) / 10,
    }));
  }, [portfolio, lines, totalWeight]);

  if (!hydrated) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-fg-0">Portefeuille simulé</h1>
        <p className="text-sm text-fg-2 mt-1">
          Construisez une allocation cible. Ajoutez des titres depuis leur fiche
          (« Ajouter à la simulation ») puis ajustez les poids.
        </p>
      </header>

      {lines.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-ink-4 rounded-xl">
          <p className="text-fg-2 text-sm">
            Aucune ligne pour l&apos;instant. Commencez par rechercher un asset.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 bg-sage text-ink-0 text-sm font-medium px-4 py-2 rounded-lg hover:bg-sage-bright transition-colors"
            >
              <Search className="w-4 h-4" aria-hidden />
              Rechercher un asset
            </Link>
            <button
              onClick={addCashLine}
              className="inline-flex items-center gap-2 border border-ink-4 text-fg-1 text-sm px-4 py-2 rounded-lg hover:border-sage-dim transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-sage" aria-hidden />
              Ajouter des liquidités
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-ink-3 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-2 text-left text-xs uppercase tracking-wide text-fg-3">
                  <th className="px-4 py-2.5">Instrument</th>
                  <th className="px-4 py-2.5">Classe</th>
                  <th className="px-4 py-2.5 text-right">Poids cible (%)</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={`${l.ticker}-${i}`} className="border-t border-ink-3">
                    <td className="px-4 py-2.5">
                      <div className="text-fg-0">{l.name}</div>
                      <div className="font-mono text-xs text-fg-3">{l.ticker}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={l.assetClass}
                        onChange={(e) =>
                          updateLine(i, { assetClass: e.target.value as AssetClass })
                        }
                        className="bg-ink-1 border border-ink-4 rounded-md px-2 py-1 text-sm text-fg-1 focus:outline-none focus:border-sage"
                      >
                        {CLASS_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={l.weightPercent}
                        onChange={(e) =>
                          updateLine(i, { weightPercent: Number(e.target.value) })
                        }
                        className="w-24 bg-ink-1 border border-ink-4 rounded-md px-2 py-1 text-right font-mono text-fg-0 focus:outline-none focus:border-sage"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => persist(lines.filter((_, j) => j !== i))}
                        className="text-fg-3 hover:text-negative transition-colors"
                        title="Retirer la ligne"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-3 bg-ink-2">
                  <td className="px-4 py-2.5 font-medium text-fg-1" colSpan={2}>
                    Total
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono ${
                      Math.abs(totalWeight - 100) < 0.5 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {totalWeight.toFixed(1)}%
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={addCashLine}
              className="inline-flex items-center gap-2 border border-ink-4 text-fg-1 text-sm px-4 py-2 rounded-lg hover:border-sage-dim transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-sage" aria-hidden />
              Ajouter des liquidités
            </button>
            <button
              onClick={normalize}
              className="inline-flex items-center gap-2 border border-ink-4 text-fg-1 text-sm px-4 py-2 rounded-lg hover:border-sage-dim transition-colors"
            >
              <Scale className="w-4 h-4 text-sage" aria-hidden />
              Normaliser à 100%
            </button>
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 border border-ink-4 text-fg-1 text-sm px-4 py-2 rounded-lg hover:border-sage-dim transition-colors"
            >
              <Search className="w-4 h-4 text-sage" aria-hidden />
              Ajouter un titre
            </Link>
          </div>

          {portfolio ? (
            <ComparisonBars
              data={comparison}
              title="Allocation par classe d'actifs — portefeuille actuel vs simulé"
            />
          ) : (
            <p className="text-sm text-fg-3">
              Chargez un portefeuille client pour afficher la comparaison actuel vs simulé.
            </p>
          )}
        </>
      )}
    </div>
  );
}

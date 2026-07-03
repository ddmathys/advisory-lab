"use client";

// Composants graphiques (Recharts) — règles dataviz appliquées :
// teintes catégorielles en ordre fixe (jamais recyclées), >6 catégories → « Autres »,
// espaceurs 2px couleur surface entre segments, légende présente dès 2 séries,
// tooltips au survol, texte en tokens texte (jamais en couleur de série).

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, chartColor } from "@/lib/palette";
import { fmtCHF } from "@/lib/storage";

const SURFACE = "#15181c"; // ink-2 : surface des cartes graphiques
const GRID = "#2a2f36"; // ink-4
const TEXT_MUTED = "#8b877e"; // fg-2
const TEXT = "#c8c5bc"; // fg-1

const tooltipStyle = {
  backgroundColor: "#1e2228",
  border: "1px solid #2a2f36",
  borderRadius: 8,
  color: "#f4f2ec",
  fontSize: 12,
};

export interface Slice {
  name: string;
  value: number;
}

/** Regroupe au-delà de 6 catégories dans « Autres » (la palette ne se recycle pas). */
function foldSlices(data: Slice[]): Slice[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= 6) return sorted;
  const kept = sorted.slice(0, 5);
  const rest = sorted.slice(5).reduce((s, d) => s + d.value, 0);
  return [...kept, { name: "Autres", value: rest }];
}

/** Donut de répartition (part d'un tout) avec légende et tooltip. */
export function AllocationDonut({ data, title }: { data: Slice[]; title: string }) {
  const slices = foldSlices(data.filter((d) => d.value > 0));
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-4">
      <h3 className="text-sm font-medium text-fg-1 mb-2">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={1.5}
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s, i) => (
                <Cell key={s.name} fill={chartColor(i)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [
                `${fmtCHF(Number(value))} CHF (${((Number(value) / total) * 100).toFixed(1)}%)`,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: TEXT, fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Barres horizontales de concentration par position (nominal : une seule teinte). */
export function ConcentrationBars({
  data,
  title,
  thresholdPercent = 10,
}: {
  data: { name: string; percent: number }[];
  title: string;
  thresholdPercent?: number;
}) {
  const sorted = [...data].sort((a, b) => b.percent - a.percent).slice(0, 12);
  const height = Math.max(180, sorted.length * 32 + 40);

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-4">
      <h3 className="text-sm font-medium text-fg-1 mb-1">{title}</h3>
      <p className="text-xs text-fg-3 mb-2">
        Ligne pointillée : seuil de concentration {thresholdPercent}%
      </p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 40 }}>
            <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="2 4" />
            <XAxis
              type="number"
              unit="%"
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: TEXT, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "#1e2228" }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Poids"]}
            />
            <ReferenceLine
              x={thresholdPercent}
              stroke={TEXT_MUTED}
              strokeDasharray="4 4"
            />
            <Bar
              dataKey="percent"
              fill={CHART_COLORS[0]}
              radius={[0, 4, 4, 0]}
              barSize={16}
              isAnimationActive={false}
              label={{
                position: "right",
                fill: TEXT,
                fontSize: 11,
                formatter: (v: unknown) => `${Number(v).toFixed(1)}%`,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Courbe de prix (série unique — pas de légende, le titre nomme la série). */
export function PriceChart({
  data,
  title,
  currency,
}: {
  data: { date: string; close: number }[];
  title: string;
  currency: string;
}) {
  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-4">
      <h3 className="text-sm font-medium text-fg-1 mb-2">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
            <XAxis
              dataKey="date"
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              minTickGap={60}
              tickFormatter={(d: string) => d.slice(0, 7)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${Number(value).toFixed(2)} ${currency}`, "Clôture"]}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Barres groupées de comparaison actuel vs simulé (2 séries → légende obligatoire). */
export function ComparisonBars({
  data,
  title,
}: {
  data: { name: string; actuel: number; simule: number }[];
  title: string;
}) {
  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-4">
      <h3 className="text-sm font-medium text-fg-1 mb-2">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
            <XAxis
              dataKey="name"
              tick={{ fill: TEXT, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
            />
            <YAxis
              unit="%"
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "#1e2228" }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: TEXT, fontSize: 12 }}>{value}</span>
              )}
            />
            <Bar
              dataKey="actuel"
              name="Portefeuille actuel"
              fill={CHART_COLORS[0]}
              radius={[4, 4, 0, 0]}
              barSize={18}
              isAnimationActive={false}
            />
            <Bar
              dataKey="simule"
              name="Portefeuille simulé"
              fill={CHART_COLORS[1]}
              radius={[4, 4, 0, 0]}
              barSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Palette graphique validée (skill dataviz — 6 checks PASS sur surface #15181C, mode sombre)
// Ordre FIXE : les teintes sont assignées dans l'ordre, jamais recyclées.

export const CHART_COLORS = [
  "#61A159", // sauge (marque Éclosion)
  "#4E86C6", // bleu
  "#C96F58", // terracotta
  "#26A69A", // teal
  "#B8863B", // or
  "#9678C8", // mauve
] as const;

/** Couleur d'une série par index ; au-delà de 6 → regrouper en « Autres » */
export function chartColor(index: number): string {
  return CHART_COLORS[Math.min(index, CHART_COLORS.length - 1)];
}

/** Couleurs P&L (statut, réservées — jamais utilisées comme série) */
export const POSITIVE = "#7FB27A";
export const NEGATIVE = "#C97A64";

/** Libellés français des classes d'actifs */
export const ASSET_CLASS_LABELS: Record<string, string> = {
  action: "Actions",
  obligation: "Obligations",
  fonds: "Fonds",
  etf: "ETF",
  cash: "Liquidités",
  immobilier: "Immobilier",
  crypto: "Crypto",
  matiere_premiere: "Mat. premières",
  autre: "Autres",
};

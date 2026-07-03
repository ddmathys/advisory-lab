// Persistance locale (localStorage) — pas d'authentification, données côté navigateur.
// Utilisable uniquement dans des composants clients.

import type { InvestorProfile, Portfolio, PortfolioAnalysis, SimulatedLine } from "./types";

const KEYS = {
  portfolio: "advisory-lab:portfolio",
  profile: "advisory-lab:profile",
  analysis: "advisory-lab:analysis",
  simulation: "advisory-lab:simulation",
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getPortfolio: () => read<Portfolio>(KEYS.portfolio),
  setPortfolio: (p: Portfolio) => write(KEYS.portfolio, p),
  clearPortfolio: () => window.localStorage.removeItem(KEYS.portfolio),

  getProfile: () => read<InvestorProfile>(KEYS.profile),
  setProfile: (p: InvestorProfile) => write(KEYS.profile, p),

  getAnalysis: () => read<PortfolioAnalysis>(KEYS.analysis),
  setAnalysis: (a: PortfolioAnalysis) => write(KEYS.analysis, a),
  clearAnalysis: () => window.localStorage.removeItem(KEYS.analysis),

  getSimulation: () => read<SimulatedLine[]>(KEYS.simulation),
  setSimulation: (s: SimulatedLine[]) => write(KEYS.simulation, s),
};

/** Calcule le profil (conservateur/équilibré/dynamique) à partir des réponses */
export function computeProfile(
  answers: Omit<InvestorProfile, "computed">
): InvestorProfile["computed"] {
  let score = 0;
  score += { court: 0, moyen: 2, long: 4 }[answers.horizon];
  score += { faible: 0, moyenne: 2, elevee: 4 }[answers.riskTolerance];
  score += {
    preservation: 0,
    revenu: 1,
    croissance: 3,
    croissance_agressive: 4,
  }[answers.objective];
  score += { debutant: 0, intermediaire: 1, avance: 2 }[answers.knowledge];
  score += { eleves: 0, moyens: 1, faibles: 2 }[answers.liquidityNeeds];
  // Score max = 16
  if (score <= 5) return "conservateur";
  if (score <= 11) return "equilibre";
  return "dynamique";
}

/** Formatage suisse des montants : 1'234'567 */
export function fmtCHF(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

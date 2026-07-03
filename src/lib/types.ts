// Types partagés de l'application Advisory Lab

/** Classe d'actif d'une position */
export type AssetClass =
  | "action"
  | "obligation"
  | "fonds"
  | "etf"
  | "cash"
  | "immobilier"
  | "crypto"
  | "matiere_premiere"
  | "autre";

/** Une position du portefeuille client */
export interface Position {
  id: string;
  ticker: string; // symbole EODHD si connu, ex: "NESN.SW"
  name: string;
  assetClass: AssetClass;
  quantity: number;
  price: number; // prix unitaire actuel
  currency: string; // devise de cotation, ex: CHF, USD, EUR
  value: number; // valeur totale en devise de référence (CHF)
  sector?: string;
  region?: string;
}

/** Portefeuille client */
export interface Portfolio {
  name: string;
  referenceCurrency: string;
  positions: Position[];
  updatedAt: string; // ISO
  source: "pdf" | "demo" | "manuel";
}

/** Profil d'investisseur saisi par le conseiller */
export interface InvestorProfile {
  clientName: string;
  age: number;
  horizon: "court" | "moyen" | "long"; // <3 ans, 3-8 ans, >8 ans
  riskTolerance: "faible" | "moyenne" | "elevee";
  objective: "preservation" | "revenu" | "croissance" | "croissance_agressive";
  knowledge: "debutant" | "intermediaire" | "avance";
  liquidityNeeds: "faibles" | "moyens" | "eleves";
  /** Profil calculé à partir des réponses */
  computed: "conservateur" | "equilibre" | "dynamique";
}

/** Métadonnées pédagogiques « Sous le capot » renvoyées par chaque appel IA/API */
export interface UnderTheHoodMeta {
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  tokens?: { prompt: number; completion: number };
  durationMs: number;
  dataSources: string[]; // ex: ["EODHD /fundamentals/AAPL.US", "DeepSeek chat"]
}

/** Résultat de l'extraction PDF */
export interface ExtractionResult {
  portfolio: Portfolio;
  warnings: string[];
  _meta: UnderTheHoodMeta;
}

/** Analyse de portefeuille produite par l'agent « spécialiste investissement » */
export interface PortfolioAnalysis {
  scores: {
    diversification: number; // 0-100
    adequationProfil: number; // 0-100
    qualite: number; // 0-100
  };
  syntheseExecutive: string;
  concentration: {
    commentaire: string;
    alertes: string[]; // ex: "NESN.SW représente 32% du portefeuille"
  };
  risques: string[];
  pointsForts: string[];
  recommandations: { priorite: "haute" | "moyenne" | "basse"; texte: string }[];
  /** Secteur estimé par l'IA pour chaque ticker (clé = ticker) */
  secteursEstimes: Record<string, string>;
  adequationProfilCommentaire: string;
  _meta: UnderTheHoodMeta;
}

/** Détail d'un asset récupéré via EODHD */
export interface AssetDetail {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number | null;
  changePercent: number | null;
  previousClose: number | null;
  history: { date: string; close: number }[]; // 1 an
  highlights: Record<string, unknown> | null; // Highlights EODHD
  valuation: Record<string, unknown> | null;
  analystRatings: {
    rating?: number; // 1 (strong buy) → 5 (sell)
    targetPrice?: number;
    strongBuy?: number;
    buy?: number;
    hold?: number;
    sell?: number;
    strongSell?: number;
  } | null;
  sector?: string;
  industry?: string;
  description?: string;
  _meta: UnderTheHoodMeta;
}

/** Analyse top-down d'un asset par l'agent « analyste » */
export interface AssetAnalysis {
  macro: string;
  secteur: string;
  societe: string;
  indicateurs: { nom: string; valeur: string; lecture: string }[];
  consensusCommentaire: string;
  theseInvestissement: string;
  risques: string[];
  conclusion: { avis: "positif" | "neutre" | "negatif"; texte: string };
  _meta: UnderTheHoodMeta;
}

/** Résultat de recherche EODHD */
export interface SearchResult {
  ticker: string; // Code.Exchange
  name: string;
  exchange: string;
  currency: string;
  type: string;
  country: string;
}

/** Ligne d'un portefeuille simulé */
export interface SimulatedLine {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  weightPercent: number;
  currency: string;
}

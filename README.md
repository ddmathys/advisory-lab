# Advisory Lab

Outil de démonstration pédagogique (HEG) : **l'IA au service du conseiller financier**.
Analyse de portefeuille client, analyse top-down de sociétés et portefeuille simulé,
avec à chaque étape un panneau « Sous le capot » qui expose les prompts, le modèle,
les tokens et les sources de données.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4) — déployable sur Vercel
- **DeepSeek** (`deepseek-chat`, JSON mode) — trois agents : extraction PDF,
  spécialiste investissement, analyste top-down
- **EODHD** — recherche d'instruments, cotations, historiques (+ fondamentaux si plan supérieur)
- **Finnhub** — repli gratuit pour fondamentaux + consensus analystes (titres US)
- **Recharts** — visualisations (palette validée accessibilité/CVD)
- **unpdf** — extraction de texte des relevés PDF côté serveur

Toutes les clés API restent **côté serveur** (routes API) — rien dans le navigateur.
Les données client (portefeuille, profil) restent dans le `localStorage` du navigateur.

## Parcours

1. `/portfolio` — import d'un relevé PDF (extraction IA) ou portefeuille de démo + profil d'investisseur
2. `/portfolio/analyse` — graphiques calculés localement + analyse IA (concentration, risques, adéquation au profil)
3. `/assets` → `/assets/[ticker]` — recherche EODHD, fiche instrument, consensus analystes, note top-down IA
4. `/simulation` — allocation cible comparée au portefeuille actuel

## Démarrage

```bash
cp .env.local.example .env.local   # puis renseigner les clés
npm install
npm run dev
```

Un relevé PDF d'exemple est disponible : `public/releve-demo.pdf`
(régénérable via `node scripts/make-demo-pdf.mjs`).

## Cascade de données fondamentales

| Source | Condition | Contenu |
|---|---|---|
| EODHD `/fundamentals` | plan payant « Fundamentals » | complet + consensus |
| Finnhub (gratuit) | titres US uniquement | métriques + consensus |
| Cours + historique seul | toujours | l'agent IA signale la limite |

## Déploiement Vercel

Ajouter `DEEPSEEK_API_KEY`, `EOD_API_KEY` et `FINNHUB_API_KEY` dans les
variables d'environnement du projet Vercel, puis `vercel deploy`.

---

⚠️ Outil de démonstration : ne constitue pas un conseil en investissement.

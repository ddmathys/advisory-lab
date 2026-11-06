---
name: advisory-tech
description: Spécialiste du fonctionnement technique de Advisory Lab (stack, données, déploiement, zones sensibles).
---

# Technique de Advisory Lab

## Stack et règles
- Next.js 16 : lis node_modules/next/dist/docs/ avant de coder (AGENTS.md).
- Toutes les clés (DeepSeek, EODHD, Finnhub) restent côté serveur, jamais dans le navigateur.
- Données client dans le localStorage uniquement.
- ⚠️ Le lint a des erreurs existantes (set-state-in-effect) : ne pas en ajouter.

## Zones sensibles (jamais de merge automatique)
Règles Firestore/Storage, firebase.json, vercel.json, .github/, android/, fichiers Gradle, package.json, et tout fichier lié à l'authentification, aux sessions, à l'admin, aux secrets, aux paiements ou aux crédits.

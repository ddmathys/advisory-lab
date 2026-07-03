"use client";

// Formulaire de profil d'investisseur — le profil calculé adapte l'analyse IA.

import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { computeProfile, storage } from "@/lib/storage";
import type { InvestorProfile } from "@/lib/types";

const PROFILE_LABELS: Record<InvestorProfile["computed"], string> = {
  conservateur: "Conservateur",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
};

const DEFAULTS: Omit<InvestorProfile, "computed"> = {
  clientName: "M. Dupont",
  age: 52,
  horizon: "moyen",
  riskTolerance: "moyenne",
  objective: "croissance",
  knowledge: "intermediaire",
  liquidityNeeds: "moyens",
};

export function ProfileForm({ onSaved }: { onSaved?: (p: InvestorProfile) => void }) {
  const [form, setForm] = useState<Omit<InvestorProfile, "computed">>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  // Recharge le profil sauvegardé au montage
  useEffect(() => {
    const existing = storage.getProfile();
    if (existing) {
      setForm(existing);
      setSaved(true);
    }
  }, []);

  const computed = computeProfile(form);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    const profile: InvestorProfile = { ...form, computed };
    storage.setProfile(profile);
    setSaved(true);
    onSaved?.(profile);
  }

  const selectCls =
    "w-full bg-ink-1 border border-ink-4 rounded-md px-3 py-2 text-sm text-fg-0 focus:outline-none focus:border-sage";

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-5 h-5 text-sage" aria-hidden />
        <h3 className="font-medium text-fg-0">Profil d&apos;investisseur</h3>
        <span
          className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
            computed === "conservateur"
              ? "bg-ink-4 text-fg-1"
              : computed === "equilibre"
                ? "bg-sage-dim text-sage-bright"
                : "bg-sage text-ink-0"
          }`}
        >
          {PROFILE_LABELS[computed]}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-fg-2">Nom du client</span>
          <input
            className={selectCls}
            value={form.clientName}
            onChange={(e) => update("clientName", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-fg-2">Âge</span>
          <input
            type="number"
            className={selectCls}
            value={form.age}
            min={18}
            max={100}
            onChange={(e) => update("age", Number(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-fg-2">Horizon de placement</span>
          <select
            className={selectCls}
            value={form.horizon}
            onChange={(e) => update("horizon", e.target.value as typeof form.horizon)}
          >
            <option value="court">Court (&lt; 3 ans)</option>
            <option value="moyen">Moyen (3 – 8 ans)</option>
            <option value="long">Long (&gt; 8 ans)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-fg-2">Tolérance au risque</span>
          <select
            className={selectCls}
            value={form.riskTolerance}
            onChange={(e) =>
              update("riskTolerance", e.target.value as typeof form.riskTolerance)
            }
          >
            <option value="faible">Faible</option>
            <option value="moyenne">Moyenne</option>
            <option value="elevee">Élevée</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-fg-2">Objectif principal</span>
          <select
            className={selectCls}
            value={form.objective}
            onChange={(e) => update("objective", e.target.value as typeof form.objective)}
          >
            <option value="preservation">Préservation du capital</option>
            <option value="revenu">Revenu régulier</option>
            <option value="croissance">Croissance</option>
            <option value="croissance_agressive">Croissance agressive</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-fg-2">Connaissances financières</span>
          <select
            className={selectCls}
            value={form.knowledge}
            onChange={(e) => update("knowledge", e.target.value as typeof form.knowledge)}
          >
            <option value="debutant">Débutant</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancé</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs text-fg-2">Besoins de liquidité</span>
          <select
            className={selectCls}
            value={form.liquidityNeeds}
            onChange={(e) =>
              update("liquidityNeeds", e.target.value as typeof form.liquidityNeeds)
            }
          >
            <option value="faibles">Faibles</option>
            <option value="moyens">Moyens</option>
            <option value="eleves">Élevés</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          className="bg-sage text-ink-0 text-sm font-medium px-4 py-2 rounded-lg hover:bg-sage-bright transition-colors"
        >
          Enregistrer le profil
        </button>
        {saved && <span className="text-xs text-sage">Profil enregistré ✓</span>}
      </div>
    </div>
  );
}

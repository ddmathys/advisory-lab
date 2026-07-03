"use client";

// Panneau pédagogique « Sous le capot » : montre le prompt, le modèle,
// les tokens et les sources de données de chaque appel IA — le cœur de la démo HEG.

import { useState } from "react";
import { ChevronDown, ChevronRight, Cpu } from "lucide-react";
import type { UnderTheHoodMeta } from "@/lib/types";

export function UnderTheHood({ meta }: { meta: UnderTheHoodMeta }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border border-ink-3 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-fg-2 hover:text-fg-1 hover:bg-ink-2 transition-colors"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="w-4 h-4" aria-hidden />
        ) : (
          <ChevronRight className="w-4 h-4" aria-hidden />
        )}
        <Cpu className="w-4 h-4 text-sage" aria-hidden />
        <span className="font-medium">Sous le capot</span>
        <span className="ml-auto font-mono text-xs text-fg-3">
          {meta.model ?? "API"} · {(meta.durationMs / 1000).toFixed(1)}s
          {meta.tokens
            ? ` · ${meta.tokens.prompt + meta.tokens.completion} tokens`
            : ""}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 text-sm bg-ink-1">
          <div className="grid sm:grid-cols-3 gap-3 pt-3">
            <Fact label="Modèle" value={meta.model ?? "—"} />
            <Fact label="Durée" value={`${(meta.durationMs / 1000).toFixed(2)} s`} />
            <Fact
              label="Tokens (entrée / sortie)"
              value={
                meta.tokens ? `${meta.tokens.prompt} / ${meta.tokens.completion}` : "—"
              }
            />
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wide text-fg-3 mb-1.5">
              Sources de données
            </h4>
            <ul className="space-y-1">
              {meta.dataSources.map((s) => (
                <li key={s} className="font-mono text-xs text-fg-1">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {meta.systemPrompt && (
            <PromptBlock title="Prompt système (le « rôle » donné à l'IA)" text={meta.systemPrompt} />
          )}
          {meta.userPrompt && (
            <PromptBlock title="Prompt utilisateur (les données envoyées)" text={meta.userPrompt} />
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-2 rounded-md px-3 py-2">
      <div className="text-xs text-fg-3">{label}</div>
      <div className="font-mono text-fg-0">{value}</div>
    </div>
  );
}

function PromptBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-fg-3 mb-1.5">{title}</h4>
      <pre className="bg-ink-0 border border-ink-3 rounded-md p-3 text-xs text-fg-1 whitespace-pre-wrap max-h-64 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}

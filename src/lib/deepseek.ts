// Client DeepSeek — CÔTÉ SERVEUR UNIQUEMENT.
// Leçon de l'incident Éclosion : la clé LLM ne doit jamais être exposée au client.

import type { UnderTheHoodMeta } from "./types";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

interface DeepSeekResult<T> {
  data: T;
  meta: UnderTheHoodMeta;
}

/**
 * Appelle DeepSeek en mode JSON et parse la réponse dans le type attendu.
 * Renvoie aussi les métadonnées pédagogiques « Sous le capot ».
 */
export async function deepseekJson<T>(
  systemPrompt: string,
  userPrompt: string,
  dataSources: string[] = []
): Promise<DeepSeekResult<T>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY manquante dans .env.local");

  const start = Date.now();
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek ${res.status} : ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const content: string = json.choices?.[0]?.message?.content ?? "";

  let data: T;
  try {
    data = JSON.parse(content) as T;
  } catch {
    throw new Error(`Réponse DeepSeek non parsable en JSON : ${content.slice(0, 200)}`);
  }

  const meta: UnderTheHoodMeta = {
    model: MODEL,
    systemPrompt,
    userPrompt,
    tokens: {
      prompt: json.usage?.prompt_tokens ?? 0,
      completion: json.usage?.completion_tokens ?? 0,
    },
    durationMs: Date.now() - start,
    dataSources: ["DeepSeek chat/completions (JSON mode)", ...dataSources],
  };

  return { data, meta };
}

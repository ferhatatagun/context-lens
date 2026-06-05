/**
 * Minimal Anthropic API wrapper for context-lens — only the `/v1/messages/count_tokens`
 * endpoint, no streaming needed. Browser-only, BYOK, no backend.
 *
 * Shares its bones with the other tools in the suite (claudoscope, agent-replay,
 * prompt-lab, tool-lab) but with the streaming machinery stripped out.
 */

export interface CountTokensRequest {
  model: string;
  system?: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
  messages: Array<{
    role: "user" | "assistant";
    content:
      | string
      | Array<{ type: string; text?: string; cache_control?: { type: "ephemeral" } }>;
  }>;
  tools?: Array<Record<string, unknown>>;
}

export interface CountTokensResponse {
  input_tokens: number;
}

const ENDPOINT = "https://api.anthropic.com/v1/messages/count_tokens";

export async function countTokens(
  apiKey: string,
  request: CountTokensRequest,
): Promise<CountTokensResponse> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  return res.json();
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message ?? body?.message;
    if (msg) return `${res.status} · ${msg}`;
  } catch {
    /* fall through */
  }
  if (res.status === 401) return "401 · Invalid API key.";
  if (res.status === 429) return "429 · Rate limited — wait a moment.";
  return `${res.status} · Request failed.`;
}

export function modelTier(model: string): "opus" | "sonnet" | "haiku" {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "opus";
  if (m.includes("haiku")) return "haiku";
  return "sonnet";
}

export const DEFAULT_MODELS = [
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5", tier: "sonnet" as const },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", tier: "haiku" as const },
  { id: "claude-opus-4-5", label: "Opus 4.5", tier: "opus" as const },
];

export const MODEL_CONTEXT_WINDOW = 200_000;

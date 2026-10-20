import { priceFor, resolveModel, type Price } from "./models";

export type { Price };

/** Characters per token the heuristic assumes (older tokenizer, English). */
export const CHARS_PER_TOKEN = 3.7;
/** Newer tokenizers count the same text as ~30% more tokens. */
export const NEW_TOKENIZER_FACTOR = 1.3;

/** Cheap text-based heuristic when the user has no API key.
 *  Rough rule for Claude/Anthropic-style BPE: ~3.7 chars per token in English,
 *  more in Turkish/CJK, scaled up for models on the newer tokenizer.
 *  Returns a single number for the whole input. */
export function heuristicTokenCount(text: string, model?: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Mix of char-based and word-based to handle code, English, Turkish, etc.
  const chars = trimmed.length;
  const words = trimmed.split(/\s+/).length;
  const byChars = chars / CHARS_PER_TOKEN;
  const byWords = words * 1.35;
  const factor = model && resolveModel(model).model.newTokenizer ? NEW_TOKENIZER_FACTOR : 1;
  return Math.round(((byChars + byWords) / 2) * factor);
}

export interface CostEstimate {
  uncachedInput: number;
  cachedRead: number;
  cacheWrite: number;
  output: number;
  total: number;
}

export function costFor(
  model: string,
  tokens: {
    input?: number;
    cacheRead?: number;
    cacheWrite?: number;
    output?: number;
  },
): CostEstimate {
  const promptTokens = (tokens.input ?? 0) + (tokens.cacheRead ?? 0) + (tokens.cacheWrite ?? 0);
  const p = priceFor(resolveModel(model).model, promptTokens);
  const uncachedInput = ((tokens.input ?? 0) * p.input) / 1_000_000;
  const cachedRead = ((tokens.cacheRead ?? 0) * p.cacheRead) / 1_000_000;
  const cacheWrite = ((tokens.cacheWrite ?? 0) * p.cacheWrite5m) / 1_000_000;
  const output = ((tokens.output ?? 0) * p.output) / 1_000_000;
  return {
    uncachedInput,
    cachedRead,
    cacheWrite,
    output,
    total: uncachedInput + cachedRead + cacheWrite + output,
  };
}

export function fmtUSD(n: number, opts: { precision?: number } = {}): string {
  const precision = opts.precision ?? (n < 0.01 ? 5 : n < 1 ? 4 : 2);
  return "$" + n.toFixed(precision);
}

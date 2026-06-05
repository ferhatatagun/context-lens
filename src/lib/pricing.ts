// USD per 1M tokens, by model tier. Reflects Anthropic's published pricing.
// Same source as the rest of the dev-tool suite.
export interface Price {
  input: number;
  cacheRead: number;
  cacheWrite5m: number;
  output: number;
}

export const TIERS: Record<"opus" | "sonnet" | "haiku", Price> = {
  opus: { input: 15, cacheRead: 1.5, cacheWrite5m: 18.75, output: 75 },
  sonnet: { input: 3, cacheRead: 0.3, cacheWrite5m: 3.75, output: 15 },
  haiku: { input: 1, cacheRead: 0.1, cacheWrite5m: 1.25, output: 5 },
};

export const TIER_LABEL: Record<"opus" | "sonnet" | "haiku", string> = {
  opus: "Opus",
  sonnet: "Sonnet",
  haiku: "Haiku",
};

/** Cheap text-based heuristic when the user has no API key.
 *  Rough rule for Claude/Anthropic-style BPE: ~3.7 chars per token in English,
 *  more in Turkish/CJK. Returns a single number for the whole input. */
export function heuristicTokenCount(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Mix of char-based and word-based to handle code, English, Turkish, etc.
  const chars = trimmed.length;
  const words = trimmed.split(/\s+/).length;
  const byChars = chars / 3.7;
  const byWords = words * 1.35;
  return Math.round((byChars + byWords) / 2);
}

export interface CostEstimate {
  uncachedInput: number;
  cachedRead: number;
  cacheWrite: number;
  output: number;
  total: number;
}

export function costFor(
  tier: keyof typeof TIERS,
  tokens: {
    input?: number;
    cacheRead?: number;
    cacheWrite?: number;
    output?: number;
  },
): CostEstimate {
  const p = TIERS[tier];
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

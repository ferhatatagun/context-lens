"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  countTokens,
  DEFAULT_MODELS,
  MODEL_CONTEXT_WINDOW,
  modelTier,
} from "@/lib/anthropic";
import { costFor, fmtUSD, heuristicTokenCount } from "@/lib/pricing";
import { clearApiKey, getApiKey, setApiKey } from "@/lib/storage";
import KeyDialog from "@/components/KeyDialog";

const SAMPLE_SYSTEM = `You are a senior staff engineer reviewing pull requests for a fintech company.
For each issue, return:
- severity: "critical" | "major" | "minor"
- line: number
- category: "security" | "correctness" | "performance" | "style"
- explanation: one-sentence summary
- suggestion: optional fix as a code snippet

Focus on bugs and security. Skip style nits unless they materially affect readability.`;

const SAMPLE_USER = `Review this diff and return only the JSON array described in the system prompt:

\`\`\`diff
+ const password = req.body.password;
+ if (password === user.password) {
+   return res.json({ token: jwt.sign({ id: user.id }, "secret") });
+ }
\`\`\``;

export default function Home() {
  const [system, setSystem] = useState(SAMPLE_SYSTEM);
  const [user, setUser] = useState(SAMPLE_USER);
  const [model, setModel] = useState(DEFAULT_MODELS[0].id);
  const [estimatedOutput, setEstimatedOutput] = useState(400);
  const [cached, setCached] = useState(false);

  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingApi, setUsingApi] = useState(false);

  useEffect(() => {
    setApiKeyState(getApiKey());
  }, []);

  /** Cheap heuristic — always available, updates as you type */
  const heuristic = useMemo(() => {
    const sys = heuristicTokenCount(system);
    const usr = heuristicTokenCount(user);
    return { system: sys, user: usr, total: sys + usr };
  }, [system, user]);

  /** Pick which count to use for cost: API count if available, else heuristic */
  const inputTokens = tokenCount ?? heuristic.total;
  const tier = modelTier(model);
  const cost = costFor(tier, {
    input: cached ? 0 : inputTokens,
    cacheRead: cached ? inputTokens : 0,
    output: estimatedOutput,
  });

  /** Position within the model's 200K context window */
  const windowPosition = Math.min(
    100,
    ((inputTokens + estimatedOutput) / MODEL_CONTEXT_WINDOW) * 100,
  );

  async function callCountTokens() {
    if (!apiKey) {
      setShowKeyDialog(true);
      return;
    }
    setCounting(true);
    setError(null);
    try {
      const r = await countTokens(apiKey, {
        model,
        system,
        messages: [{ role: "user", content: user }],
      });
      setTokenCount(r.input_tokens);
      setUsingApi(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCounting(false);
    }
  }

  function handleKeySaved(key: string) {
    setApiKey(key);
    setApiKeyState(key);
    setShowKeyDialog(false);
  }
  function handleKeyCleared() {
    clearApiKey();
    setApiKeyState(null);
    setTokenCount(null);
    setUsingApi(false);
  }

  // Reset API count when system/user/model changes so user doesn't see stale numbers
  useEffect(() => {
    setTokenCount(null);
    setUsingApi(false);
  }, [system, user, model]);

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100 selection:bg-violet-500/30">
      {/* Backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                context-lens
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              Paste a Claude prompt — see how it tokenizes, where caching boundaries
              live, and what each call will cost <em>before</em> you ship.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowKeyDialog(true)}
              className="px-3 py-1.5 rounded-md border border-slate-700 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors"
            >
              {apiKey ? "Key set ✓" : "Set API key"}
            </button>
            <a
              href="https://ferhatatagun.com/tools"
              className="px-3 py-1.5 rounded-md border border-slate-700 hover:border-violet-500 text-slate-400 hover:text-violet-300 transition-colors"
            >
              ↗ suite
            </a>
          </div>
        </header>

        {/* Editor + sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT: inputs */}
          <div className="space-y-4">
            <PromptField
              label="System prompt"
              accent="violet"
              value={system}
              onChange={setSystem}
              tokens={heuristic.system}
            />
            <PromptField
              label="User message"
              accent="pink"
              value={user}
              onChange={setUser}
              tokens={heuristic.user}
            />

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-slate-400">Model:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                >
                  {DEFAULT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-slate-400">Est. output:</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={estimatedOutput}
                  onChange={(e) => setEstimatedOutput(Number(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-20 text-slate-200"
                />
                <span className="text-slate-500">tokens</span>
              </label>
              <label className="flex items-center gap-2 ml-auto">
                <input
                  type="checkbox"
                  checked={cached}
                  onChange={(e) => setCached(e.target.checked)}
                  className="accent-violet-500"
                />
                <span className="text-slate-400">Assume input is cache-read</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={callCountTokens}
                disabled={counting || !system.trim()}
                className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white text-sm font-medium transition-colors"
              >
                {counting ? "Counting..." : apiKey ? "Count exact (API)" : "Set key → count exact"}
              </button>
              <span className="text-xs text-slate-500">
                {usingApi
                  ? "Showing API-accurate count"
                  : "Showing heuristic (~3.7 chars/token). Use the API for the real number."}
              </span>
            </div>

            {error && (
              <div className="text-sm text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT: x-ray */}
          <aside className="space-y-4">
            <XRayPanel
              inputTokens={inputTokens}
              outputTokens={estimatedOutput}
              windowPosition={windowPosition}
              cost={cost}
              usingApi={usingApi}
              cached={cached}
              tier={tier}
              model={DEFAULT_MODELS.find((m) => m.id === model)?.label ?? model}
            />
            <SuitePanel />
          </aside>
        </div>

        <footer className="mt-12 text-xs text-slate-500 text-center">
          <a
            href="https://github.com/ferhatatagun/context-lens"
            className="hover:text-slate-300"
          >
            Source on GitHub
          </a>
          {" · "}
          <a href="https://ferhatatagun.com" className="hover:text-slate-300">
            ferhatatagun.com
          </a>
          {" · "}
          BYOK · No backend · Your key stays in localStorage
        </footer>
      </div>

      <AnimatePresence>
        {showKeyDialog && (
          <KeyDialog
            initialKey={apiKey ?? ""}
            onSave={handleKeySaved}
            onClear={handleKeyCleared}
            onClose={() => setShowKeyDialog(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ------------------------------------------------------------------------ */

function PromptField({
  label,
  accent,
  value,
  onChange,
  tokens,
}: {
  label: string;
  accent: "violet" | "pink";
  value: string;
  onChange: (s: string) => void;
  tokens: number;
}) {
  const ring =
    accent === "violet"
      ? "focus-within:ring-violet-500/50 focus-within:border-violet-500"
      : "focus-within:ring-pink-500/50 focus-within:border-pink-500";

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/60 ${ring} focus-within:ring transition-shadow`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs">
        <span className="font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-slate-500">
          ~{tokens.toLocaleString()} tokens (heuristic)
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full bg-transparent px-4 py-3 text-sm font-mono text-slate-200 outline-none resize-y min-h-[140px] leading-relaxed"
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function XRayPanel({
  inputTokens,
  outputTokens,
  windowPosition,
  cost,
  usingApi,
  cached,
  tier,
  model,
}: {
  inputTokens: number;
  outputTokens: number;
  windowPosition: number;
  cost: ReturnType<typeof costFor>;
  usingApi: boolean;
  cached: boolean;
  tier: "opus" | "sonnet" | "haiku";
  model: string;
}) {
  return (
    <motion.div
      layout
      className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">X-Ray</h2>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
            usingApi
              ? "bg-violet-500/20 text-violet-300"
              : "bg-slate-700/40 text-slate-400"
          }`}
        >
          {usingApi ? "API ACCURATE" : "HEURISTIC"}
        </span>
      </div>

      {/* Tokens */}
      <div className="space-y-2 mb-5">
        <Row label="Input" value={inputTokens.toLocaleString()} unit="tokens" />
        <Row label="Output (est.)" value={outputTokens.toLocaleString()} unit="tokens" />
        <Row label="Total" value={(inputTokens + outputTokens).toLocaleString()} unit="tokens" muted />
      </div>

      {/* Context window bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Context window</span>
          <span className="font-mono text-slate-300">{windowPosition.toFixed(1)}% of 200K</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${windowPosition}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`h-full rounded-full ${
              windowPosition < 50
                ? "bg-violet-500"
                : windowPosition < 80
                ? "bg-amber-400"
                : "bg-pink-500"
            }`}
          />
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Cost on {model}</span>
          <span className="text-slate-500 uppercase font-mono">{tier}</span>
        </div>
        <div className="space-y-1.5 text-sm">
          {!cached ? (
            <Row label="Input" value={fmtUSD(cost.uncachedInput)} />
          ) : (
            <Row label="Cache read" value={fmtUSD(cost.cachedRead)} accent />
          )}
          <Row label="Output" value={fmtUSD(cost.output)} />
          <div className="border-t border-slate-800 pt-2 mt-2">
            <Row label="Per call" value={fmtUSD(cost.total)} muted bold />
            <Row
              label="Per 1,000 calls"
              value={fmtUSD(cost.total * 1000, { precision: 2 })}
              muted
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  unit,
  muted,
  bold,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  muted?: boolean;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-sm ${muted ? "text-slate-300" : "text-slate-400"}`}>{label}</span>
      <span
        className={`font-mono text-sm ${
          accent ? "text-violet-300" : muted ? "text-slate-100" : "text-slate-200"
        } ${bold ? "font-semibold" : ""}`}
      >
        {value}
        {unit && <span className="text-slate-500 ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function SuitePanel() {
  const tools = [
    { name: "claudoscope", url: "https://claudoscope-labs.vercel.app", tag: "x-ray a live call" },
    { name: "agent-replay", url: "https://agentreplay.vercel.app", tag: "replay an agent trace" },
    { name: "prompt-lab", url: "https://prompt-lab-promptly.vercel.app", tag: "A/B test prompts" },
    { name: "tool-lab", url: "https://tool-lab-bice.vercel.app", tag: "sandbox tool use" },
  ];
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-3">
        Suite
      </h2>
      <ul className="space-y-2">
        {tools.map((t) => (
          <li key={t.name}>
            <a
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-baseline justify-between gap-3 text-sm hover:text-violet-300 transition-colors group"
            >
              <span className="font-mono text-slate-300 group-hover:text-violet-300">
                {t.name}
              </span>
              <span className="text-xs text-slate-500 truncate">{t.tag}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500 mt-3 font-light">
        Different microscope, same protocol.{" "}
        <a
          href="https://ferhatatagun.com/blog/four-tools-in-two-weekends"
          className="underline decoration-violet-500/40 hover:decoration-violet-400"
        >
          Story
        </a>
        .
      </p>
    </div>
  );
}

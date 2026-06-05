"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  initialKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function KeyDialog({ initialKey, onSave, onClear, onClose }: Props) {
  const [key, setKey] = useState(initialKey);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Anthropic API key</h2>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          Used only to call the{" "}
          <code className="text-violet-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">
            count_tokens
          </code>{" "}
          endpoint. Stored in your browser&apos;s localStorage; never sent to any server
          other than Anthropic.
        </p>

        <input
          type="password"
          autoFocus
          placeholder="sk-ant-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none text-sm font-mono text-slate-100"
        />

        <p className="text-xs text-slate-500 mt-2">
          Get a key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 hover:text-violet-300 underline"
          >
            console.anthropic.com
          </a>
          .
        </p>

        <div className="flex items-center justify-between gap-2 mt-5">
          {initialKey ? (
            <button
              onClick={onClear}
              className="px-3 py-1.5 text-xs text-pink-400 hover:text-pink-300"
            >
              Clear stored key
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => key.trim() && onSave(key.trim())}
              disabled={!key.trim()}
              className="px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

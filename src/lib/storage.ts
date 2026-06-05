/** API key storage — same pattern as the other tools in the suite.
 *  Browser-only, no transit. localStorage with a single namespaced key. */

const KEY = "context-lens.apikey";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!key) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, key);
  } catch {
    /* silent */
  }
}

export function clearApiKey(): void {
  setApiKey("");
}

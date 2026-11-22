/**
 * localStorage that never throws. Storage can be missing (private windows, blocked cookies, prerender),
 * so every call has a fallback and the app works without it. Keys are prefixed and listed here.
 */
export const KEYS = {
  tos: "sp.tos.v1",
  mockState: "sp.mock.v1",
  drafts: "sp.drafts.v1",
  exportLog: "sp.exportlog.v1",
  reveal: "sp.reveal.v1",
} as const;

export function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const s = window.localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}

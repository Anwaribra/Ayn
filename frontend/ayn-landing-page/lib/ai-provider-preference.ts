/**
 * Browser preference for which AI backend route runs first (Gemini vs OpenRouter).
 * Sent on each request as X-AI-Provider; backend still falls back if the preferred provider fails.
 */

export type AIProviderPref = "auto" | "gemini" | "openrouter"

export const AI_PROVIDER_STORAGE_KEY = "ayn-ai-provider-preference"

export function normalizeAiProviderPref(raw: string | null | undefined): AIProviderPref {
  const s = (raw ?? "").trim().toLowerCase()
  if (s === "gemini" || s === "openrouter") return s
  return "auto"
}

export const OPEN_AI_PROVIDER_PICKER_EVENT = "ayn-open-ai-provider-picker"

/** Headers to merge into fetch (browser only — no-op on server). */
export function getAIProviderFetchHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const p = normalizeAiProviderPref(window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY))
  if (p === "auto") return {}
  return { "X-AI-Provider": p }
}

export function getStoredAiProviderPref(): AIProviderPref {
  if (typeof window === "undefined") return "auto"
  return normalizeAiProviderPref(window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY))
}

export function setStoredAiProviderPref(pref: AIProviderPref): void {
  if (typeof window === "undefined") return
  if (pref === "auto") window.localStorage.removeItem(AI_PROVIDER_STORAGE_KEY)
  else window.localStorage.setItem(AI_PROVIDER_STORAGE_KEY, pref)
}

/** Next.js Route Handler: pass through browser header to the Python API. */
export function forwardAiProviderFromNextRequest(req: { headers: Headers }): Record<string, string> {
  const v = (req.headers.get("x-ai-provider") ?? "").trim().toLowerCase()
  if (v === "gemini" || v === "openrouter") return { "X-AI-Provider": v }
  return {}
}

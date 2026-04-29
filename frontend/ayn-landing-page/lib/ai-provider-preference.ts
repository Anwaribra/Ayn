/**
 * Browser preference for which AI backend runs for Horus (Gemini, OpenRouter, or alternate LLM).
 * Sends X-AI-Provider + X-AI-Provider-Mode: single when a specific provider is chosen (no cross-provider fallback).
 * Auto = no headers → server uses its default fallback chain.
 */

export type AIProviderPref = "auto" | "gemini" | "openrouter" | "alt_llm"

export const AI_PROVIDER_STORAGE_KEY = "ayn-ai-provider-preference"

export function normalizeAiProviderPref(raw: string | null | undefined): AIProviderPref {
  const s = (raw ?? "").trim().toLowerCase()
  if (s === "gemini" || s === "openrouter" || s === "alt_llm") return s
  return "auto"
}

export const OPEN_AI_PROVIDER_PICKER_EVENT = "ayn-open-ai-provider-picker"

/** Headers to merge into fetch (browser only — no-op on server). */
export function getAIProviderFetchHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const p = normalizeAiProviderPref(window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY))
  if (p === "auto") return {}
  return {
    "X-AI-Provider": p,
    "X-AI-Provider-Mode": "single",
  }
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
  const out: Record<string, string> = {}
  const v = (req.headers.get("x-ai-provider") ?? "").trim().toLowerCase()
  if (v === "gemini" || v === "openrouter" || v === "alt_llm") {
    out["X-AI-Provider"] = v
  }
  const mode = (req.headers.get("x-ai-provider-mode") ?? "").trim()
  if (mode) {
    out["X-AI-Provider-Mode"] = mode
  }
  return out
}

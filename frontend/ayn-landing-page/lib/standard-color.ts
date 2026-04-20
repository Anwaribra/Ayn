const STANDARD_COLOR_CLASS_MAP: Record<string, string> = {
  "from-emerald-600 to-teal-600": "from-emerald-600 to-teal-600",
  "from-blue-600 to-indigo-600": "from-blue-600 to-indigo-600",
  "from-amber-600 to-orange-600": "from-amber-600 to-orange-600",
  "from-rose-600 to-pink-600": "from-rose-600 to-pink-600",
  "from-purple-600 to-violet-600": "from-purple-600 to-violet-600",
  "from-cyan-600 to-blue-600": "from-cyan-600 to-blue-600",
  "from-blue-600 to-indigo-700": "from-blue-600 to-indigo-700",
  "from-emerald-600 to-teal-700": "from-emerald-600 to-teal-700",
  "bg-[#1E3A8A]": "bg-[#1E3A8A]",
}

const DEFAULT_STANDARD_COLOR_CLASS = "from-blue-600 to-indigo-600"

export function resolveStandardColorClass(color?: string | null): string {
  const normalized = color?.trim().replace(/\s+/g, " ")
  if (!normalized) return DEFAULT_STANDARD_COLOR_CLASS
  return STANDARD_COLOR_CLASS_MAP[normalized] ?? DEFAULT_STANDARD_COLOR_CLASS
}

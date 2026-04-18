import type { Standard } from "@/types"

/**
 * Arabic display titles for seeded / known public standards (ids match backend seed_standards.py).
 * Falls back to API `title` when no mapping exists.
 */
const STANDARD_TITLE_AR: Record<string, string> = {
  ncaaa: "معايير الهيئة الوطنية للاعتماد الأكاديمي والتقويم (NCAAA)",
  iso21001: "ISO 21001:2018 — إدارة منظمات التعليم",
  advanced: "معايير AdvancED",
  moe: "معايير وزارة التربية والتعليم — الإمارات",
  qaa: "معايير هيئة ضمان الجودة للتعليم العالي — المملكة المتحدة",
  naqaa: "معايير الهيئة القومية لضمان جودة التعليم والاعتماد — مصر",
}

export function getStandardDisplayTitle(standard: Pick<Standard, "id" | "title">, isArabic: boolean): string {
  if (!isArabic) return standard.title
  return STANDARD_TITLE_AR[standard.id] ?? standard.title
}

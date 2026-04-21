import type { Standard } from "@/types"

/** Public standards omitted from hub, sidebar, and gap-analysis pickers. */
const EXCLUDED_FROM_NAV_STANDARD_IDS = new Set<string>(["naqaa", "ncaaa", "iso21001", "advanced", "moe", "qaa"])

export function isStandardHiddenFromNavigation(standardId: string): boolean {
  return EXCLUDED_FROM_NAV_STANDARD_IDS.has(standardId)
}

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
  const mappedAr = STANDARD_TITLE_AR[standard.id];
  if (isArabic && mappedAr) return mappedAr;
  
  // If no hardcoded map, parse the text dynamically
  return extractLocalizedText(standard.title, isArabic);
}

/**
 * Automatically splits bilingual text formatted like "Arabic (English)" or "English (Arabic)".
 * Also handles basic translation for "Standard X" to "المعيار X".
 */
export function extractLocalizedText(text: string | null | undefined, isArabic: boolean): string {
  if (!text) return "";
  
  // Fast translation for generic titles
  if (isArabic) {
    if (text.startsWith("Standard ")) {
      return text.replace("Standard ", "المعيار ");
    }
    if (text.startsWith("Domain ")) {
      return text.replace("Domain ", "المجال ");
    }
    if (text.startsWith("Clause ")) {
      return text.replace("Clause ", "البند ");
    }
  }

  // Detect parenthesis wrapping dual-language text
  // e.g "التخطيط الاستراتيجي (Strategic Planning)"
  const match = text.match(/^(.*?)\s*\((.*?)\)\s*$/);
  
  if (match) {
    const part1 = match[1].trim();
    const part2 = match[2].trim();
    
    const arabicRegex = /[\u0600-\u06FF]/;
    const part1IsArabic = arabicRegex.test(part1);
    const part2IsArabic = arabicRegex.test(part2);
    
    if (isArabic) {
      if (part1IsArabic) return part1;
      if (part2IsArabic) return part2;
    } else {
      // English requested, return the one without Arabic chars, or fallback
      if (!part1IsArabic) return part1;
      if (!part2IsArabic) return part2;
    }
  }
  
  return text;
}

"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  type AIProviderPref,
  getStoredAiProviderPref,
  setStoredAiProviderPref,
} from "@/lib/ai-provider-preference"
import { useUiLanguage } from "@/lib/ui-language-context"

export function AiProviderPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const { isArabic } = useUiLanguage()
  const [pref, setPref] = useState<AIProviderPref>("auto")

  useEffect(() => {
    if (open) setPref(getStoredAiProviderPref())
  }, [open])

  const copy = {
    title: isArabic ? "تفضيل مزود الذكاء الاصطناعي" : "AI provider preference",
    desc: isArabic
      ? "«تلقائي»: سلسلة الاحتياط المعتادة على الخادم. جيمناي أو أوبن راوتر أو المزود البديل: يُستخدم المزود المختار فقط من هذا المتصفح. التضمين (embeddings) ما يزال عبر جيمناي. أوبن راوتر: OPENROUTER_BASE_URL. المزود البديل: متغيرات HORUS_ALT_LLM_* على الخادم (مفتاح ونموذج وعنوان API منفصلان عن OPENROUTER_*)."
      : "Auto: normal server fallback. Gemini, OpenRouter, or alternate LLM: only that provider for this browser. Embeddings still use Gemini. OpenRouter: OPENROUTER_BASE_URL. Alternate: HORUS_ALT_LLM_* env vars (separate key/model/base URL from OPENROUTER_*).",
    auto: isArabic ? "تلقائي (افتراضي الخادم)" : "Auto (server default order)",
    gemini: "Gemini",
    openrouter: "OpenRouter",
    altLlm: isArabic ? "مزود بديل (HORUS_ALT)" : "Alternate LLM (HORUS_ALT)",
    altLlmSub: isArabic
      ? "OpenAI-compatible API — لا يغيّر OPENROUTER_*"
      : "OpenAI-compatible API — leaves your OPENROUTER_* vars untouched",
    hint: isArabic
      ? "افتح البحث أعلى الصفحة (⌘K أو Ctrl+K) واكتب ayn:ai أو ayn:model أو ayn:alt"
      : "Open the top search (⌘K or Ctrl+K), then type ayn:ai, ayn:model, or ayn:alt",
  }

  const row = (p: AIProviderPref, label: string, sub?: string) => (
    <button
      key={p}
      type="button"
      onClick={() => {
        setStoredAiProviderPref(p)
        setPref(p)
        onOpenChange(false)
      }}
      className={cn(
        "flex w-full flex-col items-stretch rounded-2xl border px-4 py-3 text-left transition-colors",
        isArabic && "text-right",
        pref === p
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] hover:bg-[var(--glass-strong-bg)]",
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      {sub ? <span className="mt-0.5 text-xs text-muted-foreground">{sub}</span> : null}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "border-[var(--glass-border)] bg-background/95 backdrop-blur-xl sm:max-w-md",
          isArabic && "[&>button]:left-4 [&>button]:right-auto",
        )}
      >
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="text-foreground/70">{copy.desc}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          {row("auto", copy.auto)}
          {row("gemini", copy.gemini, "googleapis / direct")}
          {row("openrouter", copy.openrouter, "openrouter.ai")}
          {row("alt_llm", copy.altLlm, copy.altLlmSub)}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{copy.hint}</p>
      </DialogContent>
    </Dialog>
  )
}

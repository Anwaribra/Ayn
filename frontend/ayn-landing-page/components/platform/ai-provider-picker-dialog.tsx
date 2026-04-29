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
      ? "يُرسل مع الطلبات ليعطِّي أولوية لطريق جيمناي أو أوبن راوتر. إذا فشل المفضّل، يستخدم النظام البديل تلقائياً. التضمين (embeddings) ما يزال عبر جيمناي."
      : "Sent with each request to try Gemini or OpenRouter first. If that fails, the server falls back automatically. Embeddings still use Gemini.",
    auto: isArabic ? "تلقائي (افتراضي الخادم)" : "Auto (server default order)",
    gemini: "Gemini",
    openrouter: "OpenRouter",
    hint: isArabic
      ? "افتح البحث أعلى الصفحة (⌘K أو Ctrl+K) واكتب ayn:ai أو ayn:model"
      : "Open the top search (⌘K or Ctrl+K), then type ayn:ai or ayn:model",
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
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{copy.hint}</p>
      </DialogContent>
    </Dialog>
  )
}

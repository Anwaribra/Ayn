"use client"

import { useUiLanguage } from "@/lib/ui-language-context"
import { Sparkles, ShieldCheck, Zap, ArrowRight, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function HorusUpgradePromo() {
  const { isArabic } = useUiLanguage()

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(59,111,217,0.08),transparent)] p-6 sm:p-10 shadow-[0_20px_40px_-20px_rgba(37,99,235,0.15)]"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,111,217,0.45),transparent)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(59,111,217,0.15),transparent_70%)] blur-3xl" />
      
      <div className={cn("relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between", isArabic && "lg:flex-row-reverse text-right")}>
        <div className="max-w-2xl">
          <div className={cn("mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary", isArabic && "flex-row-reverse")}>
            <Sparkles className="h-3.5 w-3.5" />
            {isArabic ? "ترقية المنصة" : "Platform Upgrade"}
          </div>
          
          <h2 className="mb-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {isArabic ? "ارتقِ بقدراتك مع حورس AI" : "Get upgraded by using Horus AI"}
          </h2>
          
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isArabic 
              ? "افتح المستوى التالي من الامتثال الآلي. حورس AI يحلل الفجوات، ويقوم بتدقيق افتراضي، ويولد خطط عمل فورية لضمان تطابق مؤسستك مع المعايير بأقل جهد."
              : "Unlock the next level of automated compliance. Horus AI maps evidence gaps, conducts virtual audits, and generates instant remediation plans to ensure your institution meets standards with minimal effort."
            }
          </p>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: Brain,
                title: isArabic ? "تحليل ذكي" : "Intelligent Analysis",
                desc: isArabic ? "اكتشاف تلقائي للأدلة" : "Automated evidence mapping"
              },
              {
                icon: ShieldCheck,
                title: isArabic ? "تدقيق افتراضي" : "Virtual Audits",
                desc: isArabic ? "محاكاة لأسئلة المدققين" : "Simulate auditor questions"
              },
              {
                icon: Zap,
                title: isArabic ? "معالجة فورية" : "Instant Remediation",
                desc: isArabic ? "خطوات واضحة لسد الفجوات" : "Clear steps to close gaps"
              }
            ].map((feature, idx) => (
              <div key={idx} className={cn("flex items-start gap-3", isArabic && "flex-row-reverse")}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] shadow-sm">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{feature.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="shrink-0 lg:w-[320px]">
          <div className="glass-card flex flex-col items-center justify-center overflow-hidden rounded-[24px] border border-primary/20 bg-[var(--glass-bg)] p-6 text-center shadow-[0_8px_32px_rgba(37,99,235,0.1)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(59,111,217,0.12),rgba(59,111,217,0.04))] shadow-[0_8px_16px_-8px_rgba(37,99,235,0.4)]">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              {isArabic ? "طلب صلاحية الدخول" : "Request Access"}
            </h3>
            <p className="mb-6 text-xs text-muted-foreground">
              {isArabic ? "حورس متاح للمؤسسات المعتمدة فقط." : "Horus AI is exclusively available to approved institutions."}
            </p>
            
            <Link href="/platform/horus-ai" className="w-full">
              <Button className={cn("w-full rounded-xl bg-primary py-5 text-sm font-bold shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/25", isArabic && "flex-row-reverse")}>
                {isArabic ? "طلب الترقية الآن" : "Upgrade Now"}
                <ArrowRight className={cn("h-4 w-4", isArabic ? "me-2 rotate-180" : "ms-2")} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

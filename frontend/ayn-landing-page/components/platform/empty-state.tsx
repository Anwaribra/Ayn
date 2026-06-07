"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Archive,
  BookOpen,
  Target,
  FileText,
  Upload,
  Plus,
  Lightbulb,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

interface EmptyStateProps {
  type: "evidence" | "standards" | "gap-analysis" | "dashboard" | "reports"
  title?: string
  description?: string
  onDemoLoad?: () => void
}

const arabicConfig: Record<string, { title: string; description: string; ctaText: string; tip: string }> = {
  evidence: {
    title: "جاهز للتدقيق؟",
    description: "مكتبة الأدلة المؤسسية تنتظر أصولها الأولى. قم برفع السياسات والإجراءات والوثائق لتمكين تحليل الامتثال بواسطة هوروس.",
    ctaText: "رفع أول دليل",
    tip: "نصيحة: رفع سياسة الاتصال الخاصة بك يساعد هوروس في تحديد 20% إضافية من فجوات الامتثال تلقائياً.",
  },
  standards: {
    title: "تكوين المعايير",
    description: "حدد أطر الامتثال الخاصة بك لتفعيل مراقبة هوروس. استورد من مكتبتنا أو أنشئ معايير مخصصة تناسب مؤسستك.",
    ctaText: "تصفح مكتبة المعايير",
    tip: "نصيحة: المؤسسات التي لديها 3+ معايير مرتبطة تشهد أوقات تدقيق أسرع بنسبة 45%.",
  },
  "gap-analysis": {
    title: "جاهز للتقييم؟",
    description: "قم بإجراء أول تقييم امتثال لوضع خط الأساس. سيقوم هوروس بتحديد الثغرات وإنشاء خارطة طريق للعلاج.",
    ctaText: "بدء التحليل الأول",
    tip: "نصيحة: إجراء تحليلات الفجوات شهرياً يقلل انحراف الامتثال بنسبة تصل إلى 60%.",
  },
  dashboard: {
    title: "مرحباً بك في عين",
    description: "مركز قيادة الامتثال المدعوم بالذكاء الاصطناعي جاهز. ابدأ برفع الأدلة أو استيراد المعايير لتفعيل المراقبة الفورية.",
    ctaText: "دليل البدء السريع",
    tip: "نصيحة: أكمل ملفك الشخصي وارفع 3 مستندات لفتح التوصيات المخصصة.",
  },
  reports: {
    title: "افتح الرؤى المؤسسية",
    description: "قم بإنشاء تقارير امتثال شاملة بعد ربط الأدلة والمعايير. قم بالتصدير إلى PDF أو المشاركة مع أصحاب المصلحة.",
    ctaText: "توليد التقرير",
    tip: "نصيحة: قم بجدولة تقارير تلقائية شهرية لإبقاء القيادة على اطلاع دون عمل يدوي.",
  },
}

const emptyStateConfig = {
  evidence: {
    icon: Archive,
    title: "Ready to Audit?",
    description: "Your institutional evidence library is waiting for its first assets. Upload policies, procedures, and documentation to enable Horus AI compliance analysis.",
    ctaText: "Upload First Evidence",
    ctaHref: "/platform/evidence/upload",
    ctaAction: true,
    tip: "Tip: Uploading your communication policy helps Horus AI identify 20% more compliance gaps automatically.",
    illustration: "evidence" as const,
  },
  standards: {
    icon: BookOpen,
    title: "Configure Standards",
    description: "Define your compliance frameworks to activate Horus AI monitoring. Import from our library or create custom standards tailored to your institution.",
    ctaText: "Browse Standards Library",
    ctaHref: "/platform/standards",
    ctaAction: false,
    tip: "Tip: Institutions with 3+ mapped standards see 45% faster audit completion times.",
    illustration: "standards" as const,
  },
  "gap-analysis": {
    icon: Target,
    title: "Ready for Assessment?",
    description: "Run your first compliance assessment to establish a baseline. Horus AI will identify vulnerabilities and create a remediation roadmap.",
    ctaText: "Initiate First Analysis",
    ctaHref: "/platform/gap-analysis",
    ctaAction: false,
    tip: "Tip: Running monthly gap analyses reduces compliance drift by up to 60%.",
    illustration: "analysis" as const,
  },
  dashboard: {
    icon: Sparkles,
    title: "Welcome to Ayn",
    description: "Your AI-powered compliance command center is ready. Begin by uploading evidence or importing standards to activate real-time monitoring.",
    ctaText: "Quick Start Guide",
    ctaHref: "/platform/standards",
    ctaAction: true,
    tip: "Tip: Complete your profile and upload 3 documents to unlock personalized AI recommendations.",
    illustration: "welcome" as const,
  },
  reports: {
    icon: FileText,
    title: "Unlock Institutional Insights",
    description: "Generate comprehensive compliance reports once you have evidence and standards mapped. Export to PDF or share with stakeholders.",
    ctaText: "Generate Intelligence",
    ctaHref: "/platform/gap-analysis",
    ctaAction: false,
    tip: "Tip: Schedule monthly auto-reports to keep leadership informed without manual work.",
    illustration: "reports" as const,
  },
}

function EvidenceIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="40" y="20" width="120" height="140" rx="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="55" y="45" width="90" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="55" y="60" width="70" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="55" y="75" width="80" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="140" cy="130" r="25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M128 130h24M140 118v24" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="115" r="15" fill="currentColor" fillOpacity="0.08" />
      <circle cx="85" cy="115" r="12" fill="currentColor" fillOpacity="0.06" />
    </svg>
  )
}

function StandardsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="30" y="30" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="45" y="50" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="45" y="60" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="72" y="20" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <rect x="87" y="40" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="87" y="50" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="115" y="40" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <rect x="130" y="60" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
      <rect x="130" y="70" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="100" cy="120" r="20" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M92 120l6 6 12-12" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnalysisIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <circle cx="100" cy="80" r="50" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="35" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="20" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="6" fill="currentColor" fillOpacity="0.3" />
      <path d="M100 30v15M100 115v15M50 80H35M165 80h-15" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <circle cx="100" cy="45" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="150" cy="80" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="100" cy="115" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="50" cy="80" r="4" fill="currentColor" fillOpacity="0.3" />
    </svg>
  )
}

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="40" y="40" width="120" height="90" rx="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <circle cx="100" cy="85" r="25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M90 85l7 7 15-15" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="55" y="55" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="125" y="110" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

function ReportsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="50" y="20" width="100" height="120" rx="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="65" y="40" width="70" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="65" y="55" width="50" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="70" width="60" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="85" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="105" width="70" height="20" rx="4" fill="currentColor" fillOpacity="0.08" />
      <circle cx="145" cy="115" r="15" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M138 115h14M145 108v14" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const illustrations: Record<string, () => React.ReactElement> = {
  evidence: EvidenceIllustration,
  standards: StandardsIllustration,
  analysis: AnalysisIllustration,
  welcome: WelcomeIllustration,
  reports: ReportsIllustration,
}

export function EmptyState({ type, title, description, onDemoLoad }: EmptyStateProps) {
  const { isArabic } = useUiLanguage()
  const config = emptyStateConfig[type]
  const arConfig = arabicConfig[type]
  const Icon = config.icon
  const Illustration = illustrations[config.illustration]

  return (
    <div className={cn("col-span-full flex flex-col items-center justify-center px-6 py-12 text-center", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <div className="text-muted-foreground">
        <Illustration />
      </div>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-foreground">
        {title || (isArabic ? arConfig.title : config.title)}
      </h3>
      <p className="mb-7 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description || (isArabic ? arConfig.description : config.description)}
      </p>
      <Link href={config.ctaHref}>
        <Button size="lg" className="rounded-[14px] bg-primary px-6 py-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {config.ctaAction ? <Plus className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          {isArabic ? arConfig.ctaText : config.ctaText}
        </Button>
      </Link>
      <div className="mt-7 flex max-w-sm items-start gap-3 rounded-[14px] border border-amber-500/20 bg-amber-500/5 p-4">
        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isArabic ? arConfig.tip : config.tip}
        </p>
      </div>
      {type === "evidence" && onDemoLoad && (
        <div className="mt-12 pt-8 border-t border-border w-full max-w-md">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-widest text-center">
            {isArabic ? "وضع العرض المباشر" : "Live Presentation Mode"}
          </p>
          <Button variant="outline" className="group w-full rounded-[14px] border border-border py-5 text-sm font-semibold text-foreground hover:bg-muted/50" onClick={onDemoLoad}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            {isArabic ? "تحميل نموذج سياسة ISO 21001 (تجريبي)" : "Load Sample ISO 21001 Policy (Demo)"}
          </Button>
        </div>
      )}
    </div>
  )
}

export function InlineEmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-border bg-muted/30 p-10 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] border border-border bg-background">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h4 className="mb-2 text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}

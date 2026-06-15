"use client"

import { motion } from "framer-motion"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"
import { Shield, Lock, Eye, Server, Key, RefreshCw, Mail, CheckCircle } from "lucide-react"

const securityFeatures = [
  {
    icon: Lock,
    title: { en: "Encryption", ar: "التشفير" },
    desc: {
      en: "All data encrypted in transit (TLS 1.3) and at rest (AES-256). Evidence stored in isolated, encrypted buckets.",
      ar: "جميع البيانات مشفرة أثناء النقل (TLS 1.3) وعند التخزين (AES-256). الأدلة في وحدات تخزين معزولة ومشفرة.",
    },
  },
  {
    icon: Key,
    title: { en: "Authentication", ar: "المصادقة" },
    desc: {
      en: "JWT-based auth with secure token rotation. Google OAuth and RBAC across the platform.",
      ar: "مصادقة JWT مع تدوير آمن للرمز. دعم Google OAuth والصلاحيات المبنية على الأدوار.",
    },
  },
  {
    icon: Eye,
    title: { en: "Access Control", ar: "التحكم بالوصول" },
    desc: {
      en: "Fine-grained permissions ensure users only access relevant data. Full audit trail.",
      ar: "صلاحيات دقيقة تضمن وصولاً مناسباً للبيانات. سجل تدقيق كامل.",
    },
  },
  {
    icon: Server,
    title: { en: "Infrastructure", ar: "البنية التحتية" },
    desc: {
      en: "Enterprise cloud with automated backups, redundancy, and 99.9% uptime SLA.",
      ar: "سحابة مؤسسية مع نسخ احتياطي تلقائي وضمان تشغيل 99.9%.",
    },
  },
  {
    icon: Shield,
    title: { en: "Compliance", ar: "الامتثال" },
    desc: {
      en: "Built on data protection principles. Follows best practices for educational data.",
      ar: "مبنية على مبادئ حماية البيانات. تتبع أفضل الممارسات للبيانات التعليمية.",
    },
  },
  {
    icon: RefreshCw,
    title: { en: "Monitoring", ar: "المراقبة" },
    desc: {
      en: "24/7 security monitoring, rate limiting, and automated threat detection.",
      ar: "مراقبة أمنية 24/7، تحديد معدل الاستخدام، وكشف التهديدات الآلي.",
    },
  },
]

export default function SecurityPage() {
  const { isArabic } = useUiLanguage()

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <LandingNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Shield className="h-3.5 w-3.5" />
            {isArabic ? "الأمان أولاً" : "Security First"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            {isArabic ? "الأمان في عين" : "Security at Ayn"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isArabic
              ? "بيانات مؤسستك تستحق أعلى مستوى من الحماية. الأمان مبني في كل طبقة."
              : "Your data deserves the highest protection. Security is built into every layer."}
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {securityFeatures.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title.en}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className={cn(isArabic && "text-right")}>
                    <h3 className="font-semibold text-foreground">
                      {isArabic ? feature.title.ar : feature.title.en}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {isArabic ? feature.desc.ar : feature.desc.en}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {isArabic ? "لديك أسئلة أمنية؟" : "Have Security Questions?"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            {isArabic
              ? "نحن نأخذ الأمان بجدية. راسلنا لأي استفسار أو الإبلاغ عن ثغرة."
              : "We take security seriously. Reach out for questions or to report a vulnerability."}
          </p>
          <a
            href="mailto:hello@ayn-edu.com"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-accent"
          >
            <Mail className="h-4 w-4" />
            {isArabic ? "اتصل بفريق الأمان" : "Contact Security Team"}
          </a>
        </motion.div>
      </main>

    </div>
  )
}

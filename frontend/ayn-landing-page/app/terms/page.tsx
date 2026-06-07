"use client"

import { motion } from "framer-motion"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"
import { Scale, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  const { isArabic } = useUiLanguage()

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {isArabic ? "شروط الخدمة" : "Terms of Service"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isArabic ? "آخر تحديث: 12 مارس 2026" : "Last updated: March 12, 2026"}
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <Section title={isArabic ? "1. قبول الشروط" : "1. Acceptance of Terms"}>
              {isArabic
                ? "باستخدام منصة عين، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق، يرجى عدم استخدام خدماتنا."
                : "By accessing or using the Ayn Platform, you agree to be bound by these Terms. If you do not agree, please do not use our services."}
            </Section>

            <Section title={isArabic ? "2. وصف الخدمة" : "2. Description of Service"}>
              {isArabic
                ? "توفر عين منصة لضمان الجودة والامتثال مدعومة بالذكاء الاصطناعي — إدارة الأدلة، ربط المعايير، تحليل الفجوات، المدقق الافتراضي حورس، وتقارير الامتثال."
                : "Ayn provides an AI-powered QA and compliance platform — evidence management, standards mapping, gap analysis, Horus AI virtual auditor, and reporting."}
            </Section>

            <Section title={isArabic ? "3. حسابات المستخدمين" : "3. User Accounts"}>
              <ul className={cn("space-y-2", isArabic ? "pr-5" : "pl-5")}>
                {[
                  isArabic ? "تقديم معلومات تسجيل دقيقة" : "Provide accurate registration information",
                  isArabic ? "المسؤولية عن سرية بيانات حسابك" : "Responsible for account confidentiality",
                  isArabic ? "المسؤولية عن الأنشطة تحت حسابك" : "Responsible for account activity",
                  isArabic ? "إبلاغنا فوراً بأي استخدام غير مصرح به" : "Notify us of unauthorized use",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={isArabic ? "4. الاستخدام المقبول" : "4. Acceptable Use"}>
              <ul className={cn("space-y-2", isArabic ? "pr-5" : "pl-5")}>
                {[
                  isArabic ? "لا تستخدم المنصة لأغراض غير قانونية" : "No unlawful use",
                  isArabic ? "لا ترفع ملفات ضارة" : "No malicious files",
                  isArabic ? "لا تحاول الوصول غير المصرح به" : "No unauthorized access",
                  isArabic ? "لا تعطل وظائف المنصة" : "No disruption of services",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive/60" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={isArabic ? "5. الملكية الفكرية" : "5. Intellectual Property"}>
              {isArabic
                ? "منصة عين وحورس AI وجميع البرامج هي ملكية فكرية لشركة عين. أنت تحتفظ بملكية المحتوى الذي ترفعه."
                : "Ayn platform and Horus AI are the intellectual property of Ayn. You retain ownership of uploaded content."}
            </Section>

            <Section title={isArabic ? "6. المحتوى المولد بالذكاء الاصطناعي" : "6. AI-Generated Content"}>
              {isArabic
                ? "حورس AI يقدم تحليلات كأدوات دعم قرار. يجب مراجعة المخرجات من قبل متخصصين قبل استخدامها لتقديمات الاعتماد."
                : "Horus AI provides decision-support tools. AI outputs should be reviewed by qualified professionals."}
            </Section>

            <Section title={isArabic ? "7. الحد من المسؤولية" : "7. Limitation of Liability"}>
              {isArabic
                ? "عين غير مسؤولة عن الأضرار غير المباشرة الناشئة عن استخدام المنصة."
                : "Ayn shall not be liable for indirect damages arising from platform use."}
            </Section>

            <Section title={isArabic ? "8. الاتصال بنا" : "8. Contact"}>
              {isArabic ? "للاستفسار، اتصل بنا:" : "For questions, contact us:"}
            </Section>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href="mailto:hello@ayn-edu.com" className="text-sm text-primary hover:underline font-medium">hello@ayn-edu.com</a>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>
      </main>

      <div className="px-4 pb-4">
        <div data-section-theme="dark" style={{ borderRadius: "1.75rem", overflow: "hidden", backgroundColor: "#050810" }}>
          <LandingFooter />
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

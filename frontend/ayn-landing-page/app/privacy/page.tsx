"use client"

import { motion } from "framer-motion"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"
import { Shield, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isArabic ? "آخر تحديث: 12 مارس 2026" : "Last updated: March 12, 2026"}
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <Section title={isArabic ? "1. مقدمة" : "1. Introduction"}>
              {isArabic
                ? "منصة عين (&quot;عين&quot;، &quot;نحن&quot;، &quot;نا&quot;، أو &quot;خاصتنا&quot;) ملتزمة بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام والكشف عن وحماية معلوماتك عند استخدام منصتنا لضمان الجودة والامتثال المدعومة بالذكاء الاصطناعي."
                : "Ayn Platform (&quot;Ayn&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered quality assurance and compliance platform."}
            </Section>

            <Section title={isArabic ? "2. المعلومات التي نجمعها" : "2. Information We Collect"}>
              <p className="mb-3">{isArabic ? "نجمع المعلومات التي تقدمها لنا مباشرة:" : "We collect information that you provide directly to us:"}</p>
              <ul className={cn("space-y-2", isArabic ? "pr-5" : "pl-5")}>
                {[
                  [isArabic ? "معلومات الحساب (الاسم، البريد الإلكتروني، كلمة المرور، الدور)" : "Account information (name, email, password, role)"],
                  [isArabic ? "المعلومات المؤسسية (اسم المؤسسة، تفاصيل الاعتماد)" : "Institutional information (institution name, accreditation details)"],
                  [isArabic ? "مستندات الأدلة التي ترفعها لتحليل الامتثال" : "Evidence documents and files you upload for compliance analysis"],
                  [isArabic ? "محادثات الدردشة مع حورس AI" : "Chat conversations with Horus AI"],
                  [isArabic ? "بيانات الاستخدام وسجلات التفاعل" : "Usage data and interaction logs"],
                ].map(([text]) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={isArabic ? "3. كيف نستخدم معلوماتك" : "3. How We Use Your Information"}>
              <ul className={cn("space-y-2", isArabic ? "pr-5" : "pl-5")}>
                {[
                  [isArabic ? "تقديم وتحسين منصة عين وخدمات حورس AI" : "Provide and improve the Ayn platform and Horus AI"],
                  [isArabic ? "تحليل الأدلة مقابل معايير الاعتماد" : "Analyze evidence against accreditation standards"],
                  [isArabic ? "إنشاء تقارير الامتثال وتحليل الفجوات" : "Generate compliance reports and gap analyses"],
                  [isArabic ? "تخصيص تجربتك وتقديم توصيات" : "Personalize your experience and recommendations"],
                  [isArabic ? "التواصل معك بخصوص حسابك" : "Communicate about your account"],
                ].map(([text]) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={isArabic ? "4. أمن البيانات" : "4. Data Security"}>
              <p>
                {isArabic
                  ? "ننفذ إجراءات أمنية على مستوى المؤسسات: التشفير أثناء النقل وعند التخزين، المصادقة الآمنة، التحكم في الوصول، والتدقيق المنتظم."
                  : "We implement enterprise-grade security: encryption in transit and at rest, secure authentication, access controls, and regular audits."}
              </p>
            </Section>

            <Section title={isArabic ? "5. مشاركة البيانات" : "5. Data Sharing"}>
              <p>
                {isArabic
                  ? "لا نبيع معلوماتك الشخصية. قد نشاركها مع خدمات الطرف الثالث فقط لتقديم خدماتنا، وكلهم ملزمون باتفاقيات حماية بيانات صارمة."
                  : "We do not sell your personal data. We may share with third parties only as necessary to provide our services, under strict data protection agreements."}
              </p>
            </Section>

            <Section title={isArabic ? "6. حقوقك" : "6. Your Rights"}>
              <p>
                {isArabic
                  ? "لديك الحق في الوصول إلى بياناتك أو تصحيحها أو حذفها. للتواصل معنا:"
                  : "You have the right to access, correct, or delete your data. Contact us:"}
              </p>
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

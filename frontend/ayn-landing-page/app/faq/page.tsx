"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Search, HelpCircle, MessageCircle, BookOpen, Shield, Mail } from "lucide-react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

type Language = "en" | "ar"

const FAQ_CONTENT = {
  en: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about Horus AI and the Ayn Platform.",
    searchPlaceholder: "Search for answers...",
    categories: [
      {
        name: "General",
        icon: HelpCircle,
        questions: [
          {
            q: "What exactly is Horus AI?",
            a: "Horus AI is a specialized intelligence engine built exclusively for educational quality assurance. It acts as an autonomous auditor, evidence collector, and gap analyzer for standards like ISO 21001 and NCAAA."
          },
          {
            q: "Who is the Ayn platform for?",
            a: "Ayn is designed for K-12 Schools, Universities, and Training Centers. Whether you are a principal preparing for a local audit, or a university dean aligning multiple colleges to international standards, Ayn centralizes the entire compliance process."
          },
          {
            q: "Do I need technical expertise to use this?",
            a: "Not at all. Ayn is designed with a user-friendly, 'no-code' philosophy. If you can use basic email or document editing software, you can use Ayn. Horus AI handles the complex mapping and analysis in the background."
          }
        ]
      },
      {
        name: "Evidence & Auditing",
        icon: BookOpen,
        questions: [
          {
            q: "How does Horus AI collect evidence?",
            a: "Horus can ingest documents (PDFs, Word files, spreadsheets) and automatically scan them to extract relevant evidence. It then maps this evidence directly to the specific criteria required by your chosen standard."
          },
          {
            q: "What happens if my institution is missing evidence?",
            a: "This is where the 'Gap Analysis Engine' comes in. Horus AI constantly compares your uploaded evidence against the target standard. If a gap is detected, it flags the missing requirement and can suggest actionable steps."
          },
          {
            q: "Can multiple team members upload evidence?",
            a: "Yes. Ayn supports granular role-based access. Teachers, faculty members, and administrators can upload evidence to their assigned domains, and the central quality team can review and approve it."
          }
        ]
      },
      {
        name: "Security & Standards",
        icon: Shield,
        questions: [
          {
            q: "Which quality standards are currently supported?",
            a: "Ayn natively supports major standards including ISO 21001 and the NCAAA framework. We are continuously adding more regional and international frameworks."
          },
          {
            q: "Is our institutional data secure?",
            a: "Absolutely. We employ enterprise-grade encryption for data at rest and in transit. Your documents are processed in secure, isolated environments, and we strictly adhere to regional data privacy regulations."
          },
          {
            q: "Can we export the final self-study reports?",
            a: "Yes. Once Horus AI compiles and verifies all evidence, you can generate comprehensive, audit-ready self-study reports in standard formats (PDF, Word) with a single click."
          }
        ]
      },
      {
        name: "Onboarding & Support",
        icon: MessageCircle,
        questions: [
          {
            q: "How long does it take to implement Ayn?",
            a: "For most institutions, basic setup and standard configuration can be completed in under 2 weeks. Full integration with your LMS/SIS and historical data migration typically takes 4-6 weeks."
          },
          {
            q: "Do you provide training for our faculty?",
            a: "Absolutely. We offer comprehensive onboarding programs, including live webinars for your quality team, video tutorials for faculty, and a dedicated Customer Success Manager for enterprise clients."
          },
          {
            q: "How does the pricing work?",
            a: "Our pricing is tiered based on the size of your institution and the number of frameworks you need to manage. Contact our sales team for a custom quote."
          }
        ]
      }
    ]
  },
  ar: {
    title: "الأسئلة الشائعة",
    subtitle: "كل ما تحتاج معرفته عن حورس الذكاء الاصطناعي ومنصة عين.",
    searchPlaceholder: "ابحث عن إجابات...",
    categories: [
      {
        name: "عام",
        icon: HelpCircle,
        questions: [
          {
            q: "ما هو حورس للذكاء الاصطناعي بالتحديد؟",
            a: "حورس هو محرك ذكاء اصطناعي متخصص تم بناؤه حصرياً لضمان الجودة التعليمية. يعمل كمدقق مستقل، وجامع للأدلة، ومحلل للفجوات للمعايير مثل الاعتماد الأكاديمي والأيزو 21001."
          },
          {
            q: "لمن تم تصميم منصة عين؟",
            a: "منصة عين مصممة للمدارس والجامعات ومراكز التدريب. سواء كنت مدير مدرسة يستعد لتدقيق محلي، أو عميد جامعة يسعى لمواءمة كليات متعددة مع المعايير الدولية، فإن عين تمركز عملية الامتثال بالكامل."
          },
          {
            q: "هل أحتاج إلى خبرة تقنية لاستخدام المنصة؟",
            a: "على الإطلاق. تم تصميم عين بفلسفة سهلة الاستخدام. إذا كنت تستطيع استخدام البريد الإلكتروني أو برامج تحرير النصوص، يمكنك استخدام عين بسلاسة."
          }
        ]
      },
      {
        name: "الأدلة والتدقيق",
        icon: BookOpen,
        questions: [
          {
            q: "كيف يقوم حورس بجمع الأدلة؟",
            a: "يمكن لحورس استيعاب المستندات ومسحها ضوئياً تلقائياً لاستخراج الأدلة ذات الصلة. ثم يقوم بربطها مباشرة بالمعايير المحددة التي يتطلبها الإطار المختار."
          },
          {
            q: "ماذا يحدث إذا كانت مؤسستي تفتقر إلى بعض الأدلة؟",
            a: "هنا يأتي دور محرك تحليل الفجوات. يقارن حورس باستمرار الأدلة المرفوعة بالمعيار المستهدف. إذا اكتشف فجوة، يشير إلى المطلب المفقود ويقترح خطوات قابلة للتنفيذ."
          },
          {
            q: "هل يمكن لأعضاء فريق متعددين رفع الأدلة؟",
            a: "نعم. تدعم عين صلاحيات الوصول الدقيقة والمبنية على الأدوار. يمكن للمعلمين والإداريين رفع الأدلة في نطاقاتهم المخصصة."
          }
        ]
      },
      {
        name: "الأمان والمعايير",
        icon: Shield,
        questions: [
          {
            q: "ما هي معايير الجودة المدعومة حالياً؟",
            a: "تدعم عين بشكل أساسي الأيزو 21001 وإطار NCAAA. ونحن نضيف باستمرار المزيد من الأطر الإقليمية والدولية."
          },
          {
            q: "هل بيانات مؤسستنا آمنة؟",
            a: "بالتأكيد. نستخدم تشفير بدرجة المؤسسات الكبرى للبيانات المخزنة وأثناء النقل. تتم معالجة مستنداتك في بيئات معزولة وآمنة."
          },
          {
            q: "هل يمكننا تصدير التقارير النهائية؟",
            a: "نعم. يمكنك إنشاء تقارير دراسة ذاتية جاهزة للتدقيق بالتنسيقات القياسية بنقرة واحدة."
          }
        ]
      },
      {
        name: "التدريب والدعم",
        icon: MessageCircle,
        questions: [
          {
            q: "كم يستغرق تشغيل المنصة؟",
            a: "للمؤسسات، يمكن إكمال الإعداد الأساسي في أقل من أسبوعين. التكامل الكامل وترحيل البيانات يستغرق من 4 إلى 6 أسابيع."
          },
          {
            q: "هل تقدمون تدريباً؟",
            a: "نقدم برامج إعداد شاملة، تتضمن ورش عمل ودروس فيديو ومدير حسابات مخصص."
          },
          {
            q: "كيف يتم تحديد الأسعار؟",
            a: "تعتمد الخطط على حجم مؤسستك وعدد الأطر التي تحتاج لإدارتها. تواصل مع فريق المبيعات للحصول على عرض سعر."
          }
        ]
      }
    ]
  }
}

function AccordionItem({ q, a, lang }: { q: string; a: string; lang: Language }) {
  const [isOpen, setIsOpen] = useState(false)
  const isArabic = lang === "ar"

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left gap-3 group"
      >
        <h3 className={cn(
          "text-base md:text-lg font-medium text-foreground group-hover:text-primary transition-colors",
          isArabic && "font-arabic text-right"
        )}>
          {q}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={cn(
              "pb-5 text-muted-foreground leading-relaxed text-sm md:text-base",
              isArabic && "font-arabic text-right text-lg"
            )}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const { isArabic } = useUiLanguage()
  const lang: Language = isArabic ? "ar" : "en"
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const content = FAQ_CONTENT[lang]

  const filteredCategories = content.categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0)
     .filter(cat => activeCategory && !searchQuery ? cat.name === activeCategory : true)

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <LandingNavbar />

      <main className="flex-1 py-32 pb-24 md:py-40 md:pb-32 px-5">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
              <HelpCircle className="h-3.5 w-3.5" />
              {isArabic ? "لديك سؤال؟" : "Got a question?"}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                {isArabic ? "كيف يمكننا مساعدتك؟" : "How can we help?"}
              </h1>
              <p className="text-muted-foreground text-lg">{content.subtitle}</p>
            </motion.div>

            <div className="relative mt-8 max-w-md mx-auto">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50", isArabic ? "right-5" : "left-5")} />
              <input
                type="text"
                placeholder={content.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full h-13 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm",
                  isArabic ? "pr-14 pl-5 text-right" : "pl-14 pr-5"
                )}
              />
            </div>
          </div>

          {/* Layout */}
          <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 items-start", isArabic && "md:[&>*:first-child]:col-start-4 md:[&>*:last-child]:col-start-1")}>
            {/* Sidebar */}
            <div className="md:sticky top-32 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 px-3">
                {isArabic ? "الاقسام" : "Categories"}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    !activeCategory && !searchQuery ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    isArabic && "text-right"
                  )}
                >
                  {isArabic ? "الكل" : "All Questions"}
                </button>
                {content.categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); setSearchQuery(""); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5",
                      activeCategory === cat.name && !searchQuery ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      isArabic && "text-right flex-row-reverse"
                    )}
                  >
                    <cat.icon className="h-4 w-4 shrink-0" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">
                    {isArabic ? "لم يتم العثور على نتائج." : "No results found."}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredCategories.map((category, idx) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="rounded-2xl border border-border bg-card p-6 md:p-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <category.icon className="h-4.5 w-4.5" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">
                          {category.name}
                        </h2>
                      </div>
                      <div className="flex flex-col">
                        {category.questions.map((item, i) => (
                          <AccordionItem key={i} q={item.q} a={item.a} lang={lang} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="px-3 md:px-5 py-4 mt-auto">
        <div data-section-theme="dark" style={{ borderRadius: "1.75rem", overflow: "hidden", backgroundColor: "#050810" }}>
          <LandingFooter />
        </div>
      </div>
    </div>
  )
}

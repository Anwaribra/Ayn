"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Globe, Sparkles, Search } from "lucide-react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { cn } from "@/lib/utils"

const PAGE_BG = "#f5f5f3"
const DARK_BG = "#050810"

type Language = "en" | "ar"

// Content Data
const FAQ_CONTENT = {
  en: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about Horus AI and the Ayn Platform.",
    langSwitch: "العربية",
    categories: [
      {
        name: "General",
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
        questions: [
          {
            q: "How does Horus AI collect evidence?",
            a: "Horus can ingest documents (PDFs, Word files, spreadsheets) and automatically scan them to extract relevant evidence. It then maps this evidence directly to the specific criteria required by your chosen standard (e.g., NCAAA indicators)."
          },
          {
            q: "What happens if my institution is missing evidence?",
            a: "This is where the 'Gap Analysis Engine' comes in. Horus AI constantly compares your uploaded evidence against the target standard. If a gap is detected, it flags the missing requirement and can suggest actionable steps to fulfill it before the actual audit."
          },
          {
            q: "Can multiple team members upload evidence?",
            a: "Yes. Ayn supports granular role-based access. Teachers, faculty members, and administrators can upload evidence to their assigned domains, and the central quality team can review and approve it."
          }
        ]
      },
      {
        name: "Security & Standards",
        questions: [
          {
            q: "Which quality standards are currently supported?",
            a: "Ayn natively supports major standards including ISO 21001 (Educational Organizations Management System) and the NCAAA (National Center for Academic Accreditation and evAluation) framework. We are continuously adding more regional and international frameworks."
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
        name: "Integrations & LMS",
        questions: [
          {
            q: "Does Ayn integrate with our existing Learning Management System (LMS)?",
            a: "Yes. Ayn provides secure API connectors for popular LMS platforms like Blackboard, Canvas, and Moodle. This allows Horus AI to directly pull course specifications, syllabi, and student performance data without manual data entry."
          },
          {
            q: "Can it connect to our Student Information System (SIS)?",
            a: "Ayn supports integration with major SIS platforms (like Banner and CampusNexus) to automatically fetch quantitative data required for KPIs and benchmarking indicators."
          }
        ]
      },
      {
        name: "Onboarding & Support",
        questions: [
          {
            q: "How long does it take to implement Ayn?",
            a: "For most institutions, basic setup and standard configuration can be completed in under 2 weeks. Full integration with your LMS/SIS and historical data migration typically takes 4–6 weeks."
          },
          {
            q: "Do you provide training for our faculty?",
            a: "Absolutely. We offer comprehensive onboarding programs, including live webinars for your quality team, video tutorials for faculty, and a dedicated Customer Success Manager for enterprise clients."
          },
          {
            q: "How does the pricing work?",
            a: "Our pricing is tiered based on the size of your institution (number of students/faculty) and the number of frameworks you need to manage. Contact our sales team for a custom quote tailored to your university or school."
          }
        ]
      }
    ]
  },
  ar: {
    title: "الأسئلة الشائعة",
    subtitle: "كل ما تحتاج معرفته عن حورس للذكاء الاصطناعي ومنصة عين.",
    langSwitch: "English",
    categories: [
      {
        name: "عام",
        questions: [
          {
            q: "ما هو حورس للذكاء الاصطناعي بالتحديد؟",
            a: "حورس هو محرك ذكاء اصطناعي متخصص تم بناؤه حصرياً لضمان الجودة التعليمية. يعمل كمدقق مستقل، وجامع للأدلة، ومحلل للفجوات للمعايير مثل الاعتماد الأكاديمي (NCAAA) والأيزو 21001."
          },
          {
            q: "لمن تم تصميم منصة عين؟",
            a: "منصة عين مصممة للمدارس (K-12)، والجامعات، ومراكز التدريب. سواء كنت مدير مدرسة يستعد لتدقيق محلي، أو عميد جامعة يسعى لمواءمة كليات متعددة مع المعايير الدولية، فإن عين تُمَركز عملية الامتثال بالكامل."
          },
          {
            q: "هل أحتاج إلى خبرة تقنية لاستخدام المنصة؟",
            a: "على الإطلاق. تم تصميم عين بفلسفة سهلة الاستخدام تعتمد على عدم الحاجة للبرمجة. إذا كنت تستطيع استخدام البريد الإلكتروني أو برامج تحرير النصوص، يمكنك استخدام عين بسلاسة. يقوم حورس بالتعامل مع عمليات التحليل والربط المعقدة في الخلفية."
          }
        ]
      },
      {
        name: "الأدلة والتدقيق",
        questions: [
          {
            q: "كيف يقوم حورس بجمع الأدلة؟",
            a: "يمكن لحورس استيعاب المستندات (ملفات PDF، وورد، وجداول البيانات) ومسحها ضوئياً تلقائياً لاستخراج الأدلة ذات الصلة. ثم يقوم بربط هذه الأدلة مباشرة بالمعايير المحددة التي يتطلبها الإطار المختار (مثل مؤشرات NCAAA)."
          },
          {
            q: "ماذا يحدث إذا كانت مؤسستي تفتقر إلى بعض الأدلة؟",
            a: "هنا يأتي دور 'محرك تحليل الفجوات'. يقارن حورس باستمرار الأدلة المرفوعة بالمعيار المستهدف. وإذا اكتشف فجوة، فإنه يشير إلى المطلب المفقود ويمكنه اقتراح خطوات قابلة للتنفيذ لاستيفائه قبل التدقيق الفعلي."
          },
          {
            q: "هل يمكن لأعضاء فريق متعددين رفع الأدلة؟",
            a: "نعم. تدعم منصة عين صلاحيات الوصول الدقيقة والمبنية على الأدوار. يمكن للمعلمين وأعضاء هيئة التدريس والإداريين رفع الأدلة في نطاقاتهم المخصصة، ويمكن لفريق الجودة المركزي مراجعتها واعتمادها."
          }
        ]
      },
      {
        name: "الأمان والمعايير",
        questions: [
          {
            q: "ما هي معايير الجودة المدعومة حالياً؟",
            a: "تدعم منصة عين بشكل أساسي المعايير الكبرى بما في ذلك الأيزو 21001 (نظام إدارة المؤسسات التعليمية) وإطار المركز الوطني للتقويم والاعتماد الأكاديمي (NCAAA). ونحن نضيف باستمرار المزيد من الأطر الإقليمية والدولية."
          },
          {
            q: "هل بيانات مؤسستنا آمنة؟",
            a: "بالتأكيد. نحن نستخدم تشفير بدرجة المؤسسات الكبرى (Enterprise-grade) للبيانات المُخزنة وأثناء النقل. تتم معالجة مستنداتك في بيئات معزولة وآمنة، ونحن نلتزم بشكل صارم بلوائح خصوصية البيانات الإقليمية."
          },
          {
            q: "هل يمكننا تصدير التقارير النهائية للدراسة الذاتية؟",
            a: "نعم. بمجرد أن يقوم حورس بتجميع والتحقق من جميع الأدلة، يمكنك إنشاء تقارير دراسة ذاتية شاملة وجاهزة للتدقيق بالتنسيقات القياسية (PDF، Word) بنقرة واحدة."
          }
        ]
      },
      {
        name: "الربط التقني والأنظمة",
        questions: [
          {
            q: "هل ترتبط منصة عين بنظام إدارة التعلم (LMS) الحالي لدينا؟",
            a: "نعم. توفر عين واجهات برمجة تطبيقات (APIs) آمنة للربط مع المنصات الشهيرة مثل بلاك بورد (Blackboard)، وكانفاس (Canvas)، وموودل (Moodle). يتيح ذلك لحورس سحب توصيفات المقررات ومفرداتها وبيانات أداء الطلاب مباشرة دون الحاجة للإدخال اليدوي."
          },
          {
            q: "هل يمكن ربط المنصة بنظام معلومات الطلاب (SIS) الخاص بنا؟",
            a: "تدعم منصة عين التكامل أو الربط مع أنظمة معلومات الطلاب الكبرى (مثل Banner و CampusNexus) لجلب البيانات الكمية المطلوبة لمؤشرات الأداء الرئيسية (KPIs) والمقارنات المرجعية تلقائياً."
          }
        ]
      },
      {
        name: "التدريب والدعم الفني",
        questions: [
          {
            q: "كم يستغرق تشغيل المنصة في مؤسستي؟",
            a: "بالنسبة لمعظم المؤسسات، يمكن إكمال الإعداد الأساسي في أقل من أسبوعين. أما التكامل الكامل مع أنظمتكم الحالية وترحيل البيانات التاريخية فيستغرق عادة من 4 إلى 6 أسابيع."
          },
          {
            q: "هل تقدمون تدريباً لأعضاء هيئة التدريس والموظفين؟",
            a: "بالتأكيد. نقدم برامج إعداد شاملة، تتضمن ورش عمل لفريق الجودة الخاص بك، ودروس فيديو تعليمية للمعلمين، ومدير حسابات مخصص (Customer Success Manager) لعملاء باقات المؤسسات الكبرى."
          },
          {
            q: "كيف يتم تحديد أسعار الاشتراك في منصة عين؟",
            a: "تعتمد خطط الأسعار لدينا على حجم مؤسستك (عدد الطلاب والموظفين) وعدد معايير الجودة أو الأطر التي تحتاج لإدارتها. تواصل مع فريق المبيعات للحصول على عرض سعر مخصص ومناسب لجامعتك أو مدرستك."
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
    <div className="border-b border-black/5 dark:border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none group"
      >
        <h3 className={cn(
          "text-base md:text-lg font-medium text-foreground group-hover:text-primary transition-colors",
          isArabic && "font-arabic text-right w-full ml-4"
        )}>
          {q}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn("flex-shrink-0 text-foreground/40 group-hover:text-primary transition-colors", isArabic && "order-first")}
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
              "pb-5 text-foreground/60 leading-relaxed text-sm md:text-base",
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
  const [lang, setLang] = useState<Language>("en")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  const content = FAQ_CONTENT[lang]
  const isArabic = lang === "ar"

  const toggleLanguage = () => {
    setLang(prev => prev === "en" ? "ar" : "en")
    setSearchQuery("")
    setActiveCategory(null)
  }

  // Filter categories and questions based on search
  const filteredCategories = content.categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0)
     .filter(cat => activeCategory && !searchQuery ? cat.name === activeCategory : true)

  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: "100vh" }} className="flex flex-col">
      <LandingNavbar />

      <main className="flex-1 pt-32 pb-24 md:pt-40 md:pb-32 px-5">
        <div className="max-w-6xl mx-auto relative">
          
          {/* Hero Header & Search */}
          <div className="text-center mb-16 relative z-10 max-w-2xl mx-auto">
            <div className="flex justify-center mb-8">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all text-sm font-medium text-foreground hover:bg-white"
              >
                <Globe className="w-4 h-4" />
                <span className={isArabic ? "font-sans" : "font-arabic"}>
                  {content.langSwitch}
                </span>
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className={cn(
                "text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6",
                isArabic && "font-arabic leading-tight"
              )}>
                {isArabic ? "كيف يمكننا مساعدتك؟" : "How can we help?"}
              </h1>
              
              <div className="relative mt-8 group">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40", isArabic ? "right-6" : "left-6")} />
                <input 
                  type="text"
                  placeholder={isArabic ? "ابحث عن إجابات..." : "Search for answers..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full h-14 rounded-full border border-black/10 bg-white/80 backdrop-blur-md text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm group-hover:shadow-md",
                    isArabic ? "pr-14 pl-6 text-right font-arabic" : "pl-14 pr-6"
                  )}
                />
              </div>
            </motion.div>
          </div>

          {/* Main Layout: Sticky Sidebar + Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 relative z-10 items-start">
            
            {/* Left Sidebar (Categories) */}
            <div className={cn("col-span-1 md:sticky top-32 space-y-2", isArabic && "md:col-start-4 md:row-start-1")}>
              <h3 className={cn("text-xs font-bold uppercase tracking-wider text-foreground/40 mb-4 px-3", isArabic && "text-right font-arabic")}>
                {isArabic ? "الاقسام" : "Categories"}
              </h3>
              <div className="space-y-1 flex flex-col items-stretch">
                <button
                  onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    !activeCategory && !searchQuery ? "bg-black/5 text-foreground" : "text-foreground/60 hover:bg-black/5 hover:text-foreground",
                    isArabic && "text-right font-arabic"
                  )}
                >
                  {isArabic ? "الكل" : "All Questions"}
                </button>
                {content.categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                        setActiveCategory(cat.name)
                        setSearchQuery("")
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      activeCategory === cat.name && !searchQuery ? "bg-black/5 text-foreground" : "text-foreground/60 hover:bg-black/5 hover:text-foreground",
                      isArabic && "text-right font-arabic"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content (Questions) */}
            <div className={cn("col-span-1 md:col-span-3", isArabic && "md:col-start-1 md:row-start-1")}>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-20">
                  <p className={cn("text-foreground/50", isArabic && "font-arabic")}>
                    {isArabic ? "لم يتم العثور على نتائج بحث تطابق استفسارك." : "No results found for your search."}
                  </p>
                </div>
              ) : (
                <div className="space-y-10 md:space-y-12">
                  {filteredCategories.map((category, idx) => (
                    <motion.div 
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm border border-black/5"
                    >
                      <h2 className={cn(
                        "text-xl font-bold text-foreground mb-6",
                        isArabic && "font-arabic text-right w-full"
                      )}>
                        {category.name}
                      </h2>
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

      {/* Footer wrapped in dark theme data attribute */}
      <div className="px-3 md:px-5 py-4 mt-auto">
        <div data-section-theme="dark" style={{ borderRadius: "1.75rem", overflow: "hidden", backgroundColor: DARK_BG }}>
          <LandingFooter />
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, X, Send, Sparkles, Loader2, Globe } from "lucide-react"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender: "user" | "horus"
  text: string
}

const FAQ_DATA = {
  en: [
    {
      id: "what-is-ayn",
      q: "What is Ayn?",
      a: "Ayn (عين) is an AI-powered Quality Assurance & Accreditation platform. It helps universities and schools automate curriculum alignment, gap analysis, and document evidence collection, preparing you for audits in minutes instead of months."
    },
    {
      id: "how-horus-works",
      q: "How does Horus AI work?",
      a: "Horus is our core AI reasoning engine. It ingests course specifications, reports, and syllabi, automatically mapping learning outcomes against compliance standards (like ISO 21001 or NCAAA) to instantly flag informational gaps."
    },
    {
      id: "standards-accreditation",
      q: "Which standards are supported?",
      a: "Ayn supports ISO 21001 (Educational Organizations), NCAAA (Saudi Arabia), ABET (Engineering), QS Stars, EFQM, and custom Ministry of Education frameworks. It dynamically configures layouts to match your required standard."
    },
    {
      id: "free-trial",
      q: "How can I try Ayn?",
      a: "You can start a free trial immediately! Just click 'Get Started' or 'Register' in the top header. You will configure your workspace via our interactive Onboarding and run your first QA evaluation in minutes."
    }
  ],
  ar: [
    {
      id: "what-is-ayn",
      q: "ما هو منصة عين؟",
      a: "عين هي منصة ذكية مدعومة بالذكاء الاصطناعي لإدارة ضمان الجودة والاعتماد الأكاديمي. تساعد الجامعات والمدارس في أتمتة مطابقة المناهج، تحليل الفجوات، وجمع ملفات الأدلة لتكون جاهزاً للمراجعات والاعتماد في دقائق بدلاً من شهور."
    },
    {
      id: "how-horus-works",
      q: "كيف يعمل حورس AI؟",
      a: "محرك حورس هو العقل المدبر للمنصة. يقوم بقراءة توصيفات المقررات والبرامج الدراسية والأدلة الورقية، ويطابق مخرجات التعلم لحظياً مع المعايير المطلوبة (مثل ISO 21001 أو NCAAA) لتحديد الثغرات بدقة."
    },
    {
      id: "standards-accreditation",
      q: "ما هي المعايير المدعومة؟",
      a: "تدعم عين معايير ISO 21001 الخاصة بالمؤسسات التعليمية، NCAAA (المملكة العربية السعودية)، ABET (الهندسة والتكنولوجيا)، QS Stars، EFQM، ومعايير وزارات التعليم المحلية بشكل مخصص وتفاعلي."
    },
    {
      id: "free-trial",
      q: "كيف يمكنني تجربة عين؟",
      a: "يمكنك البدء في تجربة المنصة مجاناً فوراً! فقط اضغط على زر 'ابدأ مجاناً' في أعلى الصفحة. ستتمكن من إعداد مساحة عملك عبر نظام التهيئة الذكي والبدء في تقييم جودة ملفاتك الأكاديمية خلال دقائق."
    }
  ]
}

const FALLBACK_RESPONSES = {
  en: "I'm here to help you get started with Ayn! Try clicking one of the suggested questions above, or click 'Get Started' in the header to set up your free trial.",
  ar: "أنا هنا لمساعدتك في البدء مع منصة عين! جرب الضغط على أحد الأسئلة المقترحة أعلاه، أو اضغط على 'ابدأ مجاناً' في الأعلى لبدء التجربة المجانية."
}

export function HorusLandingAssistant() {
  const { isArabic } = useUiLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentLang = isArabic ? "ar" : "en"
  const faqs = FAQ_DATA[currentLang]

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "horus",
          text: isArabic
            ? "أهلاً بك! أنا حورس، المساعد الذكي لمنصة عين. كيف يمكنني مساعدتك اليوم في أتمتة جودة مؤسستك التعليمية؟"
            : "Hello! I am Horus, Ayn's AI assistant. How can I help you automate your institution's Quality Assurance and Compliance today?"
        }
      ])
    }
  }, [isArabic])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setIsTyping(true)

    // Simulate Horus response
    setTimeout(() => {
      // Find matching QA
      const cleaned = text.toLowerCase().trim()
      let answer = FALLBACK_RESPONSES[currentLang]

      // Match logic
      const matchedFaq = faqs.find(
        f =>
          cleaned.includes(f.q.toLowerCase().trim()) ||
          f.q.toLowerCase().trim().includes(cleaned) ||
          f.id.split("-").some(word => cleaned.includes(word))
      )

      if (matchedFaq) {
        answer = matchedFaq.a
      } else {
        // Keyword checking fallback
        if (cleaned.includes("price") || cleaned.includes("pricing") || cleaned.includes("سعر") || cleaned.includes("اشتراك")) {
          answer = isArabic 
            ? "توفر عين خطط اشتراك مرنة تناسب الكليات الفردية والجامعات الكبرى. يرجى الضغط على زر 'الأسعار' في أعلى الصفحة لمعاينة تفاصيل الخطط والخصومات المتاحة حالياً."
            : "Ayn offers flexible plans starting for single departments up to university-wide deployments. Click 'Pricing' in the header to review our plans and early-access rates."
        } else if (cleaned.includes("free") || cleaned.includes("trial") || cleaned.includes("تجرب") || cleaned.includes("مجانا")) {
          answer = isArabic
            ? "نعم! يمكنك تجربة عين بشكل مجاني بالكامل لمدة 14 يومًا. لا يلزم إدخال بطاقة ائتمان. فقط اضغط على زر 'ابدأ مجاناً' لبدء تهيئة حسابك."
            : "Yes! You can try Ayn completely free for 14 days with no credit card required. Click 'Get Started' to set up your workspace instantly."
        } else if (cleaned.includes("contact") || cleaned.includes("support") || cleaned.includes("تواصل") || cleaned.includes("دعم")) {
          answer = isArabic
            ? "يسعدنا تواصلك معنا! يمكنك طلب عرض توضيحي مباشر ومخصص لكليتك بالضغط على زر 'طلب عرض توضيحي' بالصفحة، أو إرسال استفسارك لفريق الدعم وسنرد عليك فوراً."
            : "We would love to help! You can book a direct live demo for your college by clicking 'Request Demo' on the navbar, or contact our support team anytime."
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "horus",
          text: answer
        }
      ])
      setIsTyping(false)
    }, 600)
  }

  return (
    <>
      {/* Floating Trigger Button — tucked partially off-screen, slides out on hover */}
      <div className={cn(
        "fixed top-1/2 -translate-y-1/2 right-0 z-[100] select-none transition-all duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-[36px] hover:translate-x-0"
      )}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          whileHover={{ scale: 1.06, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white/80 text-zinc-800 shadow-lg outline-none backdrop-blur-lg transition-all duration-300 hover:bg-white/90 hover:text-primary active:scale-95 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800/90",
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="brain"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <Brain className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Canvas Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 40 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            dir="ltr"
            className={cn(
              "fixed z-[99] flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/75 font-dmsans shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl select-none",
              isArabic && "font-arabic",
              "top-1/2 -translate-y-1/2 right-4 h-[480px] w-[calc(100vw-32px)] max-h-[calc(100vh-40px)] md:right-16 md:h-[480px] md:w-[360px]",
            )}
          >
            <div className="absolute inset-0 border border-white/5 rounded-[28px] pointer-events-none" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">Horus AI</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-white/40 leading-none">Online assistant</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed transition-all",
                    msg.sender === "user"
                      ? "ms-auto bg-primary text-primary-foreground rounded-tr-none text-right"
                      : "bg-white/5 border border-white/5 text-white/90 rounded-tl-none text-left"
                  )}
                  dir={msg.sender === "user" && isArabic ? "rtl" : "ltr"}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 text-white/50 rounded-2xl rounded-tl-none p-3 max-w-[50px] justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Fanning Suggestion Chips (Fan menu inspired) */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider px-1">
                  {isArabic ? "أسئلة مقترحة" : "Suggested questions"}
                </span>
                <div className="flex flex-wrap gap-1">
                  <AnimatePresence>
                    {faqs.map((faq, i) => (
                      <motion.button
                        key={faq.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => handleSend(faq.q)}
                        className="text-[10px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap"
                      >
                        {faq.q}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white/[0.02] border-t border-white/10 flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend(inputValue)}
                placeholder={isArabic ? "اسأل حورس أي شيء..." : "Ask Horus anything..."}
                className="flex-1 h-9 px-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white outline-none focus:border-primary/40 transition-all placeholder:text-white/20"
                dir={isArabic ? "rtl" : "ltr"}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                  inputValue.trim()
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Search, X, HelpCircle, Zap, ShieldCheck, Users, Lock, SlidersHorizontal, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQ_ITEMS = [
  {
    icon: Zap,
    question: "How does Ayn reduce accreditation effort?",
    answer:
      "Ayn centralizes the full cycle in one flow: Evidence Vault auto-tags documents, Horus AI maps them to ISO 21001 and NCAAA criteria, then Gap Analysis prioritizes what is missing. Your team moves from manual collection to audit-ready actions in minutes.",
  },
  {
    icon: ShieldCheck,
    question: "Can we trust the AI output for external audits?",
    answer:
      "Absolutely. Ayn keeps evidence, standard mapping, detected gaps, and follow-up actions in one traceable workflow. Quality leaders review rationale and close actions with a clear audit trail—eliminating fragmented spreadsheets and email threads.",
  },
  {
    icon: Users,
    question: "Does it support cross-campus collaboration?",
    answer:
      "Yes, Ayn is built for enterprise scale. Faculty and departments contribute evidence directly, while Quality Managers monitor a unified readiness dashboard. This aligns stakeholders and tracks execution velocity long before formal visits.",
  },
  {
    icon: Lock,
    question: "What security standards do you comply with?",
    answer:
      "Security is a first-class citizen. Ayn implements localized hosting options, end-to-end data encryption (AES-256 in transit and at rest), role-based access control, and complete compliance with local data protection regulations for educational institutions.",
  },
  {
    icon: SlidersHorizontal,
    question: "Can we customize compliance frameworks or use local rubrics?",
    answer:
      "Yes. While we provide built-in mappings for popular standards like ISO 21001, NCAAA, and ABET, you can define custom templates and criteria checklists directly to map your specific internal frameworks.",
  },
  {
    icon: Clock,
    question: "How long does onboarding typically take for a university?",
    answer:
      "We provide guided onboarding. Setting up the platform takes less than a day. Typically, university teams are fully trained and importing active evidence workloads within 1 to 2 weeks, supported by our integration engineers.",
  }
]

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaqs = FAQ_ITEMS.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAccordionClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section
      id="landing-faq"
      className="relative overflow-hidden px-6 py-16 md:py-20 bg-transparent"
    >
      <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
        
        <div className="mb-10 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-[0.12em] uppercase mb-4">
            Questions
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Everything you need <br className="hidden sm:block"/> to know.
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Search our guides or browse common questions about Ayn compliance system.
          </p>
        </div>

        <div className="w-full max-w-xl mb-10 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search FAQs (e.g., 'security', 'ISO', 'NCAAA')..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setOpenIndex(null)
              }}
              className="light-card w-full py-3.5 pl-12 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-card/80 focus:outline-none border border-border/60 bg-card/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full min-h-[250px]">
          {filteredFaqs.map((item, index) => {
            const Icon = item.icon
            const isOpen = openIndex === index
            return (
              <motion.div
                key={item.question}
                layout
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-border/40 last:border-0"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-4 py-5 text-left focus:outline-none group cursor-pointer"
                  onClick={() => handleAccordionClick(index)}
                  aria-expanded={isOpen}
                >
                  <motion.div
                    layout
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                      isOpen ? "bg-primary/[0.1] text-primary" : "bg-muted-foreground/[0.06] text-muted-foreground group-hover:text-primary group-hover:bg-primary/[0.06]"
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </motion.div>
                  <span className={cn(
                    "flex-1 text-base md:text-lg font-semibold tracking-tight transition-all duration-300",
                    isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.question}
                  </span>

                  <motion.div
                    layout
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300",
                      isOpen ? "bg-primary/10 border-primary/20 text-primary" : "border-border/60 text-muted-foreground group-hover:border-primary/30"
                    )}
                  >
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={{ y: -6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25, delay: 0.08, ease: "easeOut" }}
                        className="pb-6 pl-[52px] pr-4 text-[15px] leading-relaxed text-muted-foreground"
                      >
                        {item.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filteredFaqs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="light-panel mx-auto max-w-md border border-dashed border-border/40 bg-card/30 px-6 py-16 text-center"
            >
              <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h4 className="text-base font-bold text-foreground mb-1">No matching questions</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                We couldn&apos;t find any FAQs matching &quot;{searchQuery}&quot;. Try searching for general terms like &quot;NCAAA&quot;, &quot;security&quot;, or &quot;onboarding&quot;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center justify-center py-2 px-4 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Clear Search Query
              </button>
            </motion.div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/faq/"
            className="inline-flex items-center gap-2 group text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Read the full framework guides
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>

      </div>
    </section>
  )
}

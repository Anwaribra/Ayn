"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type FaqItem = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does Ayn reduce accreditation effort?",
    answer:
      "Ayn centralizes the full cycle in one flow: Evidence Vault auto-tags documents, Horus AI maps them to ISO 21001 and NCAAA criteria, then Gap Analysis prioritizes what is missing. Your team moves from manual collection to audit-ready actions in minutes.",
  },
  {
    question: "Can we trust the AI output for external audits?",
    answer:
      "Absolutely. Ayn keeps evidence, standard mapping, detected gaps, and follow-up actions in one traceable workflow. Quality leaders review rationale and close actions with a clear audit trail—eliminating fragmented spreadsheets and email threads.",
  },
  {
    question: "Does it support cross-campus collaboration?",
    answer:
      "Yes, Ayn is built for enterprise scale. Faculty and departments contribute evidence directly, while Quality Managers monitor a unified readiness dashboard. This aligns stakeholders and tracks execution velocity long before formal visits.",
  },
]

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="landing-faq"
      className="relative overflow-hidden px-6 py-24 md:py-32 bg-transparent"
    >
      <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
        
        {/* Header */}
        <div className="mb-16 md:mb-24 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
            Questions
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-slate-900 mx-auto leading-tight max-w-3xl">
            Everything you need <br className="hidden sm:block"/> to know.
          </h2>
        </div>

        {/* Accordion Group */}
        <div className="w-full">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div 
                key={item.question} 
                className="border-b border-slate-200/60 last:border-0"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-6 text-left focus:outline-none group"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className={cn(
                    "text-xl md:text-2xl font-semibold tracking-tight transition-all duration-300",
                    isOpen ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"
                  )}>
                    {item.question}
                  </span>
                  
                  {/* Plus/Minus Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 border",
                    isOpen ? "bg-slate-900 border-slate-900 text-white" : "bg-transparent border-slate-200 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600"
                  )}>
                    <motion.div
                      initial={false}
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 pr-12 text-lg leading-relaxed text-slate-600 font-medium">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/faq/"
            className="inline-flex items-center gap-2 group text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Read the full framework guides
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>

      </div>
    </section>
  )
}

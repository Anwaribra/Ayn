"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "What exactly is Horus AI?",
    answer: "Horus AI is a specialized intelligence engine built exclusively for educational quality assurance. It acts as an autonomous auditor, evidence collector, and gap analyzer for standards like ISO 21001 and NCAAA."
  },
  {
    question: "How long does it take to implement Ayn?",
    answer: "For most institutions, basic setup and standard configuration can be completed in under 2 weeks. Full integration with your LMS/SIS and historical data migration typically takes 4–6 weeks."
  },
  {
    question: "Do I need technical expertise to use this?",
    answer: "Not at all. Ayn is designed with a user-friendly, 'no-code' philosophy. If you can use basic email or document editing software, you can use Ayn. Horus AI handles the complex mapping and analysis in the background."
  },
  {
    question: "Is our institutional data secure?",
    answer: "Absolutely. We employ enterprise-grade encryption for data at rest and in transit. Your documents are processed in secure, isolated environments, and we strictly adhere to regional data privacy regulations."
  },
  {
    question: "How does the pricing work?",
    answer: "Our pricing is tiered based on the size of your institution (number of students/faculty) and the number of frameworks you need to manage. Contact our sales team for a custom quote tailored to your university or school."
  }
]

export function AnimatedFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 px-5" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto">
            Everything you need to know about the Ayn Platform and Horus AI.
          </p>
        </div>

        <div className="space-y-1">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between py-6 text-left focus:outline-none group"
                >
                  <span className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-shrink-0 text-foreground/50 ml-4 group-hover:text-primary transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 pointer-events-none" />
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
                      <div className="pb-6 text-foreground/70 leading-relaxed max-w-2xl pt-1">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type FaqItem = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does Ayn reduce the time and effort of accreditation preparation?",
    answer:
      "Ayn centralizes the full cycle in one flow: Evidence Vault auto-tags documents, Horus AI maps them to ISO 21001 and NCAAA criteria, then Gap Analysis prioritizes what is missing. Your team moves from manual collection to guided, audit-ready actions in minutes.",
  },
  {
    question: "Can we trust the output for high-stakes quality reviews and external audits?",
    answer:
      "Yes. Ayn keeps evidence, standards mapping, detected gaps, and follow-up actions in one traceable workflow. Quality leaders can review rationale, assign ownership, and close actions with a clear audit trail instead of fragmented spreadsheets and email threads.",
  },
  {
    question: "Will this work for cross-functional university teams, not just the QA office?",
    answer:
      "Ayn is built for institutional collaboration. Faculty and departments contribute evidence, while Quality Managers keep a unified readiness view through Horus insights and analytics. This helps decision-makers align stakeholders and track execution velocity before formal visits.",
  },
]

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className={cn(
      "h-4 w-4 text-neutral-500 transition-transform duration-300 ease-out dark:text-neutral-400",
      open && "rotate-180"
    )}
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="landing-faq" className="px-6 py-20 md:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">FAQ</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-3xl">
            Questions quality leaders ask before they commit
          </h2>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <article key={item.question} className="border-b border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`landing-faq-answer-${index}`}
                >
                  <span className="text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-100 md:text-base">
                    {item.question}
                  </span>
                  <Chevron open={isOpen} />
                </button>

                <div
                  id={`landing-faq-answer-${index}`}
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p
                    className={cn(
                      "pb-5 pr-7 text-sm leading-relaxed text-neutral-600 transition-all duration-300 ease-out dark:text-neutral-300",
                      isOpen ? "translate-y-0" : "-translate-y-1"
                    )}
                  >
                    {item.answer}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <Link
          href="/faq/"
          className="mt-5 inline-flex items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
        >
          View all FAQs <span className="ml-1">→</span>
        </Link>
      </div>
    </section>
  )
}

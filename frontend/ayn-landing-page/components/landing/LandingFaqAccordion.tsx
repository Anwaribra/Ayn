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

/** Light landing strip (#f5f5f3): keep body copy as neutral-*, not theme `foreground`
 *  (dark mode on <html> would otherwise paint light text on light bg).
 */
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className={cn(
      "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300 ease-out",
      open && "rotate-180"
    )}
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="landing-faq"
      className="relative overflow-hidden px-6 py-24 text-neutral-950 md:py-32 dark:text-neutral-950"
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Match AboutSection: badge + headline hierarchy on light landing strip */}
        <div className="mb-10 text-center md:mb-14 md:text-left">
          <span className="glass-pill mb-4 inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            FAQ
          </span>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Questions quality leaders ask before they commit
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 md:text-lg md:mx-0">
            Evidence, standards mapping, and traceable actions in one place—before you expand the rollout.
          </p>
        </div>

        <div className="border-t border-black/10">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <article key={item.question} className="border-b border-black/10">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium leading-relaxed md:text-base"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`landing-faq-answer-${index}`}
                >
                  <span>{item.question}</span>
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
                      "pb-5 pr-7 text-sm leading-relaxed text-neutral-600 transition-all duration-300 ease-out",
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
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all FAQs <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

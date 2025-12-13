"use client"

import { Marquee } from "./marquee"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"

const integrations = [
  { name: "ISO 21001", abbr: "ISO" },
  { name: "NAQAAE", abbr: "NAQ" },
  { name: "Ministry of Education", abbr: "MOE" },
  { name: "Quality Assurance", abbr: "QA" },
  { name: "Accreditation Board", abbr: "AB" },
  { name: "Standards Council", abbr: "SC" },
]

export function LogoCloud() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/50 to-black" />

      <div className="relative z-10">
        <ScrollAnimationWrapper className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Compatible With Leading Standards</p>
        </ScrollAnimationWrapper>

        <Marquee speed={30} className="py-4">
          {integrations.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900/30 border border-zinc-800/30 mx-4"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center text-xs font-medium text-zinc-400">
                {item.abbr}
              </div>
              <span className="text-sm text-zinc-500 whitespace-nowrap">{item.name}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

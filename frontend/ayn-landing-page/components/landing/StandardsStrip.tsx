"use client"

/**
 * Standards Trust Strip
 * ─────────────────────
 * Infinite marquee of quality/compliance framework names.
 * Pure CSS animation — no JS loop, no fake numbers.
 * Sits between the dark hero card and the first light section.
 */

const STANDARDS = [
  "ISO 21001",
  "NCAAA",
  "MOE Frameworks",
  "ABET",
  "QS Standards",
  "EFQM",
  "CBUAE",
  "IAC",
  "ISO 9001",
  "OQAC",
  "ANAB",
  "WASC",
]

function StripItem({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 mx-6 shrink-0">
      <span className="w-1 h-1 rounded-full bg-foreground/20" />
      <span className="text-sm font-medium text-foreground/45 tracking-wide whitespace-nowrap">
        {label}
      </span>
    </span>
  )
}

export function StandardsStrip() {
  return (
    <div className="relative py-5 overflow-hidden">
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #f5f5f3, transparent)" }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #f5f5f3, transparent)" }}
      />

      <div className="flex" style={{ width: "max-content" }}>
        {/* First copy */}
        <div className="flex items-center standards-marquee">
          {STANDARDS.map((s) => (
            <StripItem key={s} label={s} />
          ))}
        </div>
        {/* Duplicate — creates seamless loop */}
        <div className="flex items-center standards-marquee" aria-hidden>
          {STANDARDS.map((s) => (
            <StripItem key={s + "__dup"} label={s} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .standards-marquee {
          animation: marquee 28s linear infinite;
        }
        /* Pause on hover */
        .standards-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

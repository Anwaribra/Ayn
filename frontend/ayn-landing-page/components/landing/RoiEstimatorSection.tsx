"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function RoiEstimatorSection() {
  const [programs, setPrograms] = useState(8)
  const [qaStaff, setQaStaff] = useState(6)
  const [prepWeeks, setPrepWeeks] = useState(14)

  const estimate = useMemo(() => {
    // Conservative model for a landing-page preview calculator
    const baselineHours = programs * prepWeeks * 10
    const automationSavingsRate = clamp(0.2 + qaStaff * 0.02, 0.22, 0.45)
    const savedHours = Math.round(baselineHours * automationSavingsRate)

    const acceleratedWeeks = clamp(Math.round(prepWeeks * 0.35), 2, prepWeeks - 1)
    const newTimeline = prepWeeks - acceleratedWeeks

    return {
      savedHours,
      acceleratedWeeks,
      newTimeline,
    }
  }, [programs, qaStaff, prepWeeks])

  return (
    <section id="roi-estimator" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <span className="glass-pill inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            ROI Estimator
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            See potential impact in 30 seconds
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Adjust your institution profile and preview estimated time savings for each accreditation cycle.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="glass-surface-strong rounded-3xl border border-black/10 p-6 lg:col-span-7 md:p-8">
            <div className="space-y-7">
              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Programs / departments</span>
                  <span className="text-sm text-muted-foreground">{programs}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={programs}
                  onChange={(e) => setPrograms(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Quality team size</span>
                  <span className="text-sm text-muted-foreground">{qaStaff}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={qaStaff}
                  onChange={(e) => setQaStaff(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Current prep timeline (weeks)</span>
                  <span className="text-sm text-muted-foreground">{prepWeeks}</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={40}
                  value={prepWeeks}
                  onChange={(e) => setPrepWeeks(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </label>
            </div>
          </div>

          <div className="glass-surface rounded-3xl border border-black/10 p-6 lg:col-span-5 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Estimated outcome per cycle</p>

            <div className="mt-6 space-y-6">
              <div className="border-b border-black/10 pb-4">
                <p className="text-sm text-muted-foreground">Hours saved</p>
                <p className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{estimate.savedHours}h</p>
              </div>

              <div className="border-b border-black/10 pb-4">
                <p className="text-sm text-muted-foreground">Timeline acceleration</p>
                <p className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{estimate.acceleratedWeeks} weeks</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">New estimated readiness timeline</p>
                <p className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{estimate.newTimeline} weeks</p>
              </div>
            </div>

            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get your custom rollout plan
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

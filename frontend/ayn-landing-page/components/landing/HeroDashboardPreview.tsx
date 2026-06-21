"use client"

import type { ReactNode } from "react"
import {
  LayoutDashboard,
  Brain,
  FileCheck,
  Scale,
  Microscope,
  Workflow,
  BarChart4,
  Archive,
  Settings,
  Search,
  Bell,
  Sparkles,
  Cpu,
  FileText,
  AlertTriangle,
  Activity,
} from "lucide-react"
import { CircularGauge } from "@/components/ui/circular-gauge"
import { cn } from "@/lib/utils"
import { HERO_MOCK } from "./hero-mock-data"

const NAV_ICONS = {
  Dashboard: LayoutDashboard,
  "Horus AI": Brain,
  "Evidence Vault": FileCheck,
  "Standards Hub": Scale,
  "Gap Analysis": Microscope,
  "Workflow Engine": Workflow,
  Analytics: BarChart4,
  Archive,
  Settings,
} as const

const STAT_ICONS = [FileText, AlertTriangle, Activity, Microscope]

const TONE_STYLES = {
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  slate: "border-border bg-muted/60 text-muted-foreground",
} as const

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/80 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Compact product glimpse for small screens (full preview is md+). */
function HeroDashboardPreviewMobile() {
  const { user, stats, standards } = HERO_MOCK
  const topStandard = standards[0]

  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto w-full max-w-[1080px] select-none overflow-hidden rounded-xl border border-border/70 bg-background p-3.5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] md:hidden"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold tracking-tighter flex items-center leading-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-black/90 to-primary">Ayn</span>
          <span className="text-primary">.</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {HERO_MOCK.brainStatus}
        </span>
      </div>

      <Panel className="mb-2.5 p-3 text-left">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {HERO_MOCK.institution}
        </p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">
          {HERO_MOCK.greeting}, <span className="font-normal text-muted-foreground">{user.displayName}</span>
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Readiness{" "}
          <span className="font-bold text-emerald-600">{HERO_MOCK.readinessScore}%</span> ·{" "}
          {HERO_MOCK.trackedStandards} standards
        </p>
      </Panel>

      <div className="mb-2.5 grid grid-cols-2 gap-2">
        {stats.slice(0, 2).map((tile) => (
          <Panel key={tile.label} className="p-2.5 text-left">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{tile.status}</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-foreground">{tile.label}</p>
            <p className="mt-1 text-base font-black text-foreground">{tile.value}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-2.5 text-left">
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
          <span className="truncate font-medium text-foreground/90">{topStandard.name}</span>
          <span className="shrink-0 font-bold tabular-nums text-muted-foreground">{topStandard.coverage}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary/50"
            style={{ width: `${topStandard.coverage}%` }}
          />
        </div>
        <p className="mt-1.5 text-[9px] text-muted-foreground">+{standards.length - 1} more frameworks tracked</p>
      </Panel>
    </div>
  )
}

export function HeroDashboardPreview() {
  const { user, reports, stats, standards, nav } = HERO_MOCK

  return (
    <>
      <HeroDashboardPreviewMobile />
      <div
        aria-hidden
        className="pointer-events-none mx-auto hidden w-full max-w-[1080px] select-none overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_24px_64px_rgba(15,23,42,0.08)] md:block"
      >
      <div className="flex min-h-[400px] sm:min-h-[440px]">
        {/* Sidebar */}
        <aside className="hidden w-[200px] shrink-0 flex-col border-r border-border/60 bg-muted/30 p-4 md:flex">
          <div className="mb-4 px-2">
            <span className="text-[15px] font-bold tracking-tighter flex items-center leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-black/90 to-primary">Ayn</span>
              <span className="text-primary">.</span>
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 text-[12px]">
            {nav.main.map((label, i) => {
              const Icon = NAV_ICONS[label as keyof typeof NAV_ICONS]
              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium",
                    i === 0 ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{label}</span>
                  {label === "Horus AI" ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : null}
                </div>
              )
            })}

            <p className="mb-0.5 mt-4 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
              Compliance
            </p>
            {nav.compliance.map((label) => {
              const Icon = NAV_ICONS[label as keyof typeof NAV_ICONS]
              return (
                <div key={label} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{label}</span>
                </div>
              )
            })}

            <p className="mb-0.5 mt-3 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
              Automation
            </p>
            {nav.automation.map((label) => {
              const Icon = NAV_ICONS[label as keyof typeof NAV_ICONS]
              return (
                <div key={label} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{label}</span>
                </div>
              )
            })}

            <div className="mt-auto space-y-0.5 border-t border-border/60 pt-3">
              {nav.footer.map((label) => {
                const Icon = NAV_ICONS[label as keyof typeof NAV_ICONS]
                return (
                  <div key={label} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>{label}</span>
                  </div>
                )
              })}
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-foreground">{user.displayName}</p>
                  <p className="truncate text-[9px] text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-muted-foreground">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px]">Search workspace…</span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12 lg:gap-3">
            <Panel className="relative min-h-[160px] p-4 lg:col-span-7 sm:min-h-[172px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_55%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {HERO_MOCK.brainStatus}
                  </span>
                  <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:inline">
                    {HERO_MOCK.institution}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {HERO_MOCK.greeting},{" "}
                    <span className="font-normal text-muted-foreground">{user.displayName}</span>
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                    Readiness score{" "}
                    <span className="font-bold text-emerald-600">{HERO_MOCK.readinessScore}%</span> across{" "}
                    {HERO_MOCK.trackedStandards} tracked standards this cycle.
                  </p>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-2.5 lg:col-span-5">
              <Panel className="flex flex-col justify-between p-3">
                <Cpu className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {HERO_MOCK.systemHealth.label}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{HERO_MOCK.systemHealth.status}</p>
                </div>
              </Panel>
              <Panel className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Reports</p>
                  <p className="text-base font-black text-foreground">{reports.gapAnalyses}</p>
                  <p className="text-[9px] text-muted-foreground">{reports.total} total</p>
                </div>
                <CircularGauge
                  value={reports.gapAnalyses}
                  max={reports.maxGauge}
                  label=""
                  color="#10b981"
                  className="h-14 w-14 shrink-0"
                />
              </Panel>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 xl:grid-cols-4">
            {stats.map((tile, i) => {
              const Icon = STAT_ICONS[i]
              return (
                <Panel key={tile.label} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {tile.status}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground">{tile.label}</p>
                      {"gauge" in tile && tile.gauge !== undefined ? null : (
                        <p className="mt-1.5 text-lg font-black text-foreground">{tile.value}</p>
                      )}
                    </div>
                    {"gauge" in tile && tile.gauge !== undefined ? (
                      <CircularGauge
                        value={tile.gauge}
                        label=""
                        color="#10b981"
                        className="h-12 w-12 shrink-0"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                          TONE_STYLES[tile.tone],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                  {"gauge" in tile && tile.gauge !== undefined ? (
                    <p className="mt-1 text-lg font-black text-foreground">{tile.value}</p>
                  ) : null}
                </Panel>
              )
            })}
          </div>

          <Panel className="mt-2.5 p-3 sm:p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="text-left">
                <h4 className="text-xs font-bold text-foreground sm:text-sm">Standards progress</h4>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Criteria coverage by evidence
                </p>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="space-y-2">
              {standards.map(({ name, coverage }) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                    <span className="truncate font-medium text-foreground/90">{name}</span>
                    <span className="shrink-0 font-bold tabular-nums text-muted-foreground">{coverage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary/50"
                      style={{ width: `${coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
    </>
  )
}

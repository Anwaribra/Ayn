"use client"

import { Check, X, ShieldAlert, Sparkles, Files, Layers, TrendingUp } from "lucide-react"

interface ComparisonRow {
  feature: string
  description: string
  traditional: string
  ayn: string
  icon: React.ReactNode
}

export function ComparisonTable() {
  const rows: ComparisonRow[] = [
    {
      feature: "Standards Mapping",
      description: "Aligning course specifications against NAQAAE & ISO criteria.",
      traditional: "Manual copy-paste into spreadsheets. Takes weeks of back-and-forth communication.",
      ayn: "Instant alignment. Horus AI maps courses and specs to standards in one click.",
      icon: <Layers className="w-4.5 h-4.5 text-primary shrink-0" />,
    },
    {
      feature: "Evidence Auditing",
      description: "Reviewing course files and documents for compliance.",
      traditional: "Manually searching through folders and PDFs. Gaps are easily missed.",
      ayn: "Automated audit. AI scans uploads, verifies files, and flags gaps instantly.",
      icon: <Files className="w-4.5 h-4.5 text-primary shrink-0" />,
    },
    {
      feature: "Gap Resolution",
      description: "Providing recommendations to resolve failed criteria.",
      traditional: "Drafting corrective actions manually, followed by endless email cycles.",
      ayn: "Actionable recommendations. Horus AI drafts improvement plans automatically.",
      icon: <ShieldAlert className="w-4.5 h-4.5 text-primary shrink-0" />,
    },
    {
      feature: "Accreditation Readiness",
      description: "Preparing the institution for official quality audits.",
      traditional: "Stressful preparation cycles before audit visits. Outdated reports.",
      ayn: "Continuous compliance. Live dashboards show real-time audit readiness status.",
      icon: <TrendingUp className="w-4.5 h-4.5 text-primary shrink-0" />,
    },
    {
      feature: "Quality Indicators",
      description: "Calculating compliance metrics and performance indexes.",
      traditional: "Manually collecting survey data and generating static Excel charts.",
      ayn: "Integrated charts. Real-time feedback automatically mapped to performance indicators.",
      icon: <Sparkles className="w-4.5 h-4.5 text-primary shrink-0" />,
    },
  ]

  return (
    <section id="comparison" className="relative w-full scroll-mt-28 py-8 font-dmsans max-w-7xl mx-auto px-4 sm:px-6 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col gap-2 text-center mb-8 max-w-2xl mx-auto">
        <span className="text-xs font-semibold text-primary uppercase tracking-[0.2em]">Comparison</span>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-[-0.03em] leading-tight">
          Traditional Compliance vs Ayn
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
          See how automation and Horus AI redefine quality assurance in educational institutions.
        </p>
      </div>

      {/* Table Container */}
      <div className="light-card w-full overflow-x-auto border border-border/60 bg-card/70 shadow-[0_12px_40px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <table className="w-full border-collapse text-left min-w-[750px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              <th className="py-5 px-6 w-1/3">Compliance Feature</th>
              <th className="py-5 px-6 w-1/3 border-l border-border/60">Traditional Methods</th>
              <th className="py-5 px-6 w-1/3 border-l border-border/60 bg-primary/[0.03] text-primary">Ayn Platform</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/20 transition-colors">
                
                {/* Feature description */}
                <td className="py-6 px-6 flex flex-col gap-1.5 justify-center">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="font-semibold text-foreground">{row.feature}</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-6.5 leading-relaxed">{row.description}</span>
                </td>
                
                {/* Traditional Methods column */}
                <td className="py-6 px-6 border-l border-border/60 vertical-align-top">
                  <div className="flex items-start gap-2.5 text-muted-foreground">
                    <X className="w-4.5 h-4.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{row.traditional}</span>
                  </div>
                </td>
                
                {/* Ayn Platform column */}
                <td className="py-6 px-6 border-l border-border/60 bg-primary/[0.01] vertical-align-top">
                  <div className="flex items-start gap-2.5 text-foreground">
                    <Check className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{row.ayn}</span>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

"use client"

import { AlertCircle, CheckCircle2, FileCheck, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface GapTableRow {
  criterion: string
  standard: string
  status: "gap" | "met"
  evidence_found: boolean
  action_required: string
}

interface GapTablePayload {
  rows: GapTableRow[]
}

export function GapTableCard({ payload }: { payload: GapTablePayload }) {
  const gaps = payload.rows.filter(r => r.status === "gap")
  const met = payload.rows.filter(r => r.status === "met")

  if (payload.rows.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-bold text-foreground text-[14px]">Compliance Gaps</h3>
        </div>
        <p className="text-[13px] text-muted-foreground">No criteria mappings found. Run a gap analysis first to see detailed compliance status.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-bold text-foreground text-[14px]">Compliance Gap Analysis</p>
            <p className="text-[11px] text-muted-foreground">
              {gaps.length} gap{gaps.length !== 1 ? "s" : ""} · {met.length} satisfied
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-modal)]/40">
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Criterion</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Standard</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Evidence</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action Required</th>
            </tr>
          </thead>
          <tbody>
            {/* Show gaps first */}
            {[...gaps, ...met].slice(0, 15).map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-[var(--border-subtle)]/50 transition-colors hover:bg-[var(--surface-modal)]/30",
                  row.status === "gap" ? "bg-red-500/3" : ""
                )}
              >
                <td className="px-4 py-3 text-foreground font-medium max-w-[160px]">
                  <span className="block truncate" title={row.criterion}>{row.criterion}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                  {row.standard}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.status === "met" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Met
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold whitespace-nowrap">
                      <AlertCircle className="w-2.5 h-2.5" /> Gap
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.evidence_found ? (
                    <FileCheck className="w-3.5 h-3.5 text-green-400 mx-auto" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-muted-foreground/40 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                  <span className="block truncate text-[11px]" title={row.action_required}>
                    {row.action_required}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payload.rows.length > 15 && (
          <p className="text-center text-[11px] text-muted-foreground py-3">
            Showing 15 of {payload.rows.length} criteria —{" "}
            <a href="/platform/gap-analysis" className="text-primary hover:underline">view all in Gap Analysis</a>
          </p>
        )}
      </div>
    </div>
  )
}

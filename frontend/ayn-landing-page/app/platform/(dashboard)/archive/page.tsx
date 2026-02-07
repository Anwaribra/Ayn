"use client"

import { Header } from "@/components/platform/header"

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Archive" description="Review historical assessments and evidence." />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Report</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  No history yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

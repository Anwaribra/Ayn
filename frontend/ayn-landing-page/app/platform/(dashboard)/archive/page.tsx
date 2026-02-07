"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const archiveRows = [
  { date: "Apr 14, 2024", report: "ISO 21001 Mid-year Review", status: "Completed", owner: "Horus Team" },
  { date: "Feb 02, 2024", report: "Evidence Archive Export", status: "Delivered", owner: "Ayn Admin" },
  { date: "Dec 18, 2023", report: "NAQAAE Gap Analysis", status: "Archived", owner: "Quality Office" },
]

export default function ArchivePage() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Archived Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Report</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {archiveRows.map((row) => (
                <tr key={row.report} className="border-t border-border/40">
                  <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                  <td className="px-4 py-3 text-foreground">{row.report}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

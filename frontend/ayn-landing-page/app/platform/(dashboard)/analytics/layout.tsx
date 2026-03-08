import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics & Intelligence | Ayn Platform",
  description: "Deep compliance analytics with automated trend detection, anomaly alerts, KPI tracking, and actionable AI-powered insights.",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

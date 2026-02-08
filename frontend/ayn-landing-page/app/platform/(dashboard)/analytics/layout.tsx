import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics | Ayn Platform",
  description: "Compliance insights, readiness metrics, and quality trends.",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

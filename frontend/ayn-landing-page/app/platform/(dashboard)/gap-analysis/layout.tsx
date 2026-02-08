import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gap Analysis | Ayn Platform",
  description: "AI-powered compliance gap analysis against quality standards.",
}

export default function GapAnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

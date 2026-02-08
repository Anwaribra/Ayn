import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Standards | Ayn Platform",
  description: "Browse and manage ISO 21001, NAQAAE, and custom quality standards.",
}

export default function StandardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

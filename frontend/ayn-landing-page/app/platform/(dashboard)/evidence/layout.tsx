import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Evidence Manager | Ayn Platform",
  description: "Upload, organize, and link evidence files to compliance criteria.",
}

export default function EvidenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

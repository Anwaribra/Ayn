import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compliance Archive | Ayn Platform",
  description: "Your compliance history, journey progress, and archived gap analysis reports.",
}

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

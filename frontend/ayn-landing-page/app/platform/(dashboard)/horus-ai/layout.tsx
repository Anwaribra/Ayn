import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Horus AI | Ayn Platform",
  description: "AI-powered assistant for quality assurance and compliance guidance.",
}

export default function HorusAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

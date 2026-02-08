import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calendar | Ayn Platform",
  description: "Coordinate compliance milestones, evidence reviews, and committee checkpoints.",
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

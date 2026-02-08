import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assessments | Ayn Platform",
  description: "Create, manage, and track quality assurance assessments.",
}

export default function AssessmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

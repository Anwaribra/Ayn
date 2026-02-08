import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Ayn Platform",
  description: "Overview of your compliance status, recent activities, and key metrics.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

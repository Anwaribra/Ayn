import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings | Ayn Platform",
  description: "Manage your account, institution, and platform preferences.",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

import type { ReactNode } from "react"
import PlatformShell from "@/components/platform/platform-shell"

export const metadata = {
  title: "Horus Engine Platform | Ayn",
  description: "Educational Quality Assurance & Accreditation Platform",
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}

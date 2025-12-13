import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth-context"

export const metadata = {
  title: "Horus Engine Platform | Ayn",
  description: "Educational Quality Assurance & Accreditation Platform",
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

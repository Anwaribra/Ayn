import type { ReactNode } from "react"
import PlatformShell from "@/components/platform/platform-shell"
import { CommandPaletteProvider } from "@/components/platform/command-palette-provider"

export const metadata = {
  title: "Horus Engine Platform | Ayn",
  description: "Educational Quality Assurance & Accreditation Platform",
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <PlatformShell>{children}</PlatformShell>
    </CommandPaletteProvider>
  )
}

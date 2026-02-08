import type { ReactNode } from "react"
import PlatformShell from "@/components/platform/platform-shell"
import { CommandPaletteProvider } from "@/components/platform/command-palette-provider"
import { PlatformErrorBoundary } from "@/components/platform/error-boundary"

export const metadata = {
  title: "Horus Engine Platform | Ayn",
  description: "Educational Quality Assurance & Compliance Platform",
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformErrorBoundary>
      <CommandPaletteProvider>
        <PlatformShell>{children}</PlatformShell>
      </CommandPaletteProvider>
    </PlatformErrorBoundary>
  )
}

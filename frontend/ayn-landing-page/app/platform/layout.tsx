import type { ReactNode } from "react"
import PlatformShell from "@/components/platform/platform-shell"
import { CommandPaletteProvider } from "@/components/platform/command-palette-provider"
import { PlatformErrorBoundary } from "@/components/platform/error-boundary"
import { AuthGuard } from "@/components/platform/auth-guard"
import { Toaster } from "@/components/ui/toaster"
import "./platform.css"

export const metadata = {
  title: "Horus Engine Platform | Ayn",
  description: "Educational Quality Assurance & Compliance Platform",
}

import { AmbientBackground } from "@/components/ui/ambient-background"
import { HorusProvider } from "@/lib/horus-context"

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformErrorBoundary>
      <CommandPaletteProvider>
        <AuthGuard>
          <HorusProvider>
            <div data-section="platform" className="relative min-h-screen bg-noise">
              <AmbientBackground />

              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
                Skip to Content
              </a>
              <div className="relative z-10">
                <PlatformShell>{children}</PlatformShell>
              </div>
              <Toaster />
            </div>
          </HorusProvider>
        </AuthGuard>
      </CommandPaletteProvider>
    </PlatformErrorBoundary>
  )
}

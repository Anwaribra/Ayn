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

import { HorusProvider } from "@/lib/horus-context"

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformErrorBoundary>
      <CommandPaletteProvider>
        <AuthGuard>
          <HorusProvider>
            <div data-section="platform" className="relative min-h-screen">
              {/* Global Gradient Background */}
              <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-950/40 via-teal-950/30 to-slate-950 dark:from-gray-950 dark:to-slate-950 pointer-events-none" />

              <a href="#main-content" className="skip-to-content relative z-50">
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

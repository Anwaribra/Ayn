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
            <div data-section="platform">
              <a href="#main-content" className="skip-to-content">
                Skip to Content
              </a>
              <PlatformShell>{children}</PlatformShell>
              <Toaster />
            </div>
          </HorusProvider>
        </AuthGuard>
      </CommandPaletteProvider>
    </PlatformErrorBoundary>
  )
}

"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function PlatformRegisterRedirectPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/login")
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecting to sign in with Google...
      </div>
    </div>
  )
}

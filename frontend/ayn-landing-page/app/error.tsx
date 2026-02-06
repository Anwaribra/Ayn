"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <AynLogo size="md" withGlow={false} className="mb-8" />
        <div className="rounded-full bg-destructive/10 p-4 mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We ran into an error. You can try again or go back home.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

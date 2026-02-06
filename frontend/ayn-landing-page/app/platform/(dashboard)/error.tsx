"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/platform/header"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
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
    <div className="min-h-screen bg-background">
      <Header title="Something went wrong" />
      <div className="p-4 md:p-[var(--spacing-content)] flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-8">
            We ran into an error in this section. You can try again or go back to the dashboard.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

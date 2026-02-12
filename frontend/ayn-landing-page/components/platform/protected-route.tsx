"use client"

import { useAuth } from "@/lib/auth-context"
import { log } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        // Don't redirect if we have a token (AuthContext may not have applied user yet)
        const hasToken =
          typeof window !== "undefined" && !!localStorage.getItem("access_token")
        if (!hasToken) {
          router.push("/login")
        }
      }

    }, 150)

    return () => clearTimeout(timer)
  }, [isLoading, isAuthenticated, router])

  // Show loader while loading, or when we have a token but user not set yet (avoid redirect flash)
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("access_token")
  if (isLoading || (!isAuthenticated && hasToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

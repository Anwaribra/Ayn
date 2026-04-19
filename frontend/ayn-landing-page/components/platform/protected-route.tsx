"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { WorkspaceSessionLoader } from "@/components/platform/workspace-boot-screen"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, refreshUser } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
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
  }, [isLoading, isAuthenticated, mounted, router])

  // Show loader while loading, or when we have a token but user not set yet (avoid redirect flash)
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("access_token")
  if (!mounted || isLoading || (!isAuthenticated && hasToken)) {
    return <WorkspaceSessionLoader onRetry={refreshUser} />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

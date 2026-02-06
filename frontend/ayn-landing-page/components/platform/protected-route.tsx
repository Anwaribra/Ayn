"use client"

import { useAuth } from "@/lib/auth-context"
import { log } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Add small delay to ensure AuthContext has loaded user from localStorage
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        console.log('[ProtectedRoute] Redirecting to login - no user found')
        router.push("/platform/login")
      }

      if (!isLoading && isAuthenticated && allowedRoles && user) {
        if (!allowedRoles.includes(user.role)) {
          log('[ProtectedRoute] Redirecting to dashboard - insufficient permissions')
          router.push("/platform/dashboard")
        }
      }
    }, 100) // Small delay to let AuthContext load

    return () => clearTimeout(timer)
  }, [isLoading, isAuthenticated, user, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

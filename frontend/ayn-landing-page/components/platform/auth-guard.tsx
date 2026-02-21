"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (pathname !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", pathname)
      }
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router, pathname])

  useEffect(() => {
    const setupInstitution = async () => {
      if (!isLoading && isAuthenticated) {
        // Check if user has an institutionId, if not, trigger setup
        const userStr = localStorage.getItem("user")
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            if (!user.institutionId) {
              await api.setupInstitution()
              const freshUser = await api.getCurrentUser()
              localStorage.setItem("user", JSON.stringify(freshUser))
              // Optional: trigger a refresh or event
            }
          } catch (error) {
            console.error("Failed to setup institution:", error)
          }
        }
      }
    }
    setupInstitution()
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-deep,#07090E)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-deep,#07090E)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

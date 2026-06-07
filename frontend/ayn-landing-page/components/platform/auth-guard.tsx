"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const setupRan = useRef(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      if (pathname !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", pathname)
      }
      router.replace("/login")
      return
    }
  }, [isAuthenticated, isLoading, router, pathname])

  useEffect(() => {
    if (setupRan.current || isLoading || !isAuthenticated) return
    setupRan.current = true
    const setupInstitution = async () => {
      const userStr = localStorage.getItem("user")
      if (!userStr) return
      try {
        const user = JSON.parse(userStr)
        if (!user.institutionId) {
          await api.setupInstitution()
          const freshUser = await api.getCurrentUser()
          localStorage.setItem("user", JSON.stringify(freshUser))
        }
      } catch {
        // silently fail
      }
    }
    setupInstitution()
  }, [isAuthenticated, isLoading])

  if (isLoading) return null

  if (!isAuthenticated) {
    router.replace("/login")
    return null
  }

  return <>{children}</>
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { type ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) return null

  if (!isAuthenticated) return null

  return <>{children}</>
}

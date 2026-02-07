"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Overview page now redirects to the Dashboard.
 * The dashboard page contains the full implementation with live metrics.
 */
export default function OverviewPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/platform/dashboard")
  }, [router])

  return null
}

"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"
import { log } from "@/lib/logger"

export function SessionChecker() {
  const pathname = usePathname()

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return
      if (pathname !== "/") return
      log("[SessionChecker] Checking for Supabase session...")
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        try {
          await api.syncWithSupabase(session.access_token)
          await supabase.auth.signOut()
          window.location.href = "/platform/dashboard"
        } catch (err) {
          console.error("[SessionChecker] Sync failed:", err)
        }
      }
    }
    checkSession()
  }, [pathname])

  return null
}

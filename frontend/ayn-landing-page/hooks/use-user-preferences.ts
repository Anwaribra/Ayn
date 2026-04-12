"use client"

import useSWR from "swr"

import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type Preferences = Record<string, any>

export function useUserPreferences() {
  const { user } = useAuth()

  const swr = useSWR<Preferences>(
    user ? ["user-preferences", user.id] : null,
    () => api.getPreferences(),
    {
      revalidateOnFocus: false,
    }
  )

  const savePreferences = async (nextPrefs: Preferences) => {
    const current = swr.data ?? {}
    const optimistic = { ...current, ...nextPrefs }

    await swr.mutate(
      async () => {
        const saved = await api.savePreferences(nextPrefs)
        return { ...optimistic, ...saved }
      },
      {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: false,
      }
    )
  }

  return {
    preferences: swr.data ?? {},
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
    savePreferences,
  }
}

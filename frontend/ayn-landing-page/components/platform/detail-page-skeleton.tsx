"use client"

import { Header } from "@/components/platform/header"

interface DetailPageSkeletonProps {
  title?: string
  /** Number of stat/metric blocks to show (e.g. 3 for institution) */
  statBlocks?: number
  /** Show a second card block (e.g. for criteria list) */
  showSecondaryBlock?: boolean
}

export function DetailPageSkeleton({
  title = "Loading...",
  statBlocks = 3,
  showSecondaryBlock = false,
}: DetailPageSkeletonProps) {
  return (
    <div className="min-h-screen">
      <Header title={title} />
      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />

        <div className="bg-card/50 border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
          {statBlocks > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: statBlocks }).map((_, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-lg">
                <div className="h-4 w-16 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-8 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
        </div>

        {showSecondaryBlock && (
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <div className="h-6 w-40 bg-muted rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

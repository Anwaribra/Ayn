"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface)]",
        className
      )}
    />
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="group">
      <div className="glass-panel p-8 rounded-[40px] aspect-square flex flex-col justify-between border-white/5">
        <div className="flex justify-between items-start">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="w-5 h-5 rounded" />
        </div>
        <div>
          <Skeleton className="h-16 w-24 mb-2" />
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
    </div>
  )
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EvidenceCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
        <Skeleton className="w-4 h-4 rounded" />
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-3xl p-5 border-white/5">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-16" />
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-8" />
            <Skeleton className="h-2 w-8" />
          </div>
          <Skeleton className="w-4 h-4 rounded" />
        </div>
      </div>
    </div>
  )
}

export function EvidenceGridSkeleton({ viewMode = "grid", count = 8 }: { viewMode?: "grid" | "list"; count?: number }) {
  const gridClass = viewMode === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    : "space-y-3"

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <EvidenceCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}

export function StandardsCardSkeleton() {
  return (
    <div className="glass-panel rounded-[32px] p-6 border-white/5 aspect-square flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <div>
        <Skeleton className="h-2 w-12 mb-1" />
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  )
}

export function StandardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StandardsCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="w-10 h-3 rounded" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <ActivityItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function SuggestionCardSkeleton() {
  return (
    <div className="glass-panel p-8 rounded-[36px] border-white/5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-6">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="h-2 w-16" />
      </div>
      <div>
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-3 w-full mb-6" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function SuggestionsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SuggestionCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-10" : i === columns - 1 ? "w-20" : "flex-1"
          )}
        />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-white/5">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div>
        <Skeleton className="h-5 w-16 mb-1" />
        <Skeleton className="h-2 w-20" />
      </div>
    </div>
  )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

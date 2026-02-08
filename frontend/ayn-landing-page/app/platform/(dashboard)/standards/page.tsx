"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import useSWR from "swr"
import { FileCheck, Plus, Search, ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import type { Standard } from "@/types/standards"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function StandardsPage() {
  return (
    <ProtectedRoute>
      <StandardsPageContent />
    </ProtectedRoute>
  )
}

function StandardsPageContent() {
  const { data: standards, isLoading } = useSWR("standards", () => api.getStandards())
  const [search, setSearch] = useState("")

  const filteredStandards = standards?.filter((std: Standard) => std.title.toLowerCase().includes(search.toLowerCase()))
  const canManage = true

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Standards"
        description="Quality assurance standards and criteria"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Standards" },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search standards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          {canManage && (
            <Link href="/platform/standards/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Standard
              </Button>
            </Link>
          )}
        </div>

        {/* Standards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredStandards?.length === 0 ? (
          <Empty className="bg-card border border-border rounded-xl py-16 border-solid shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileCheck className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No standards found</EmptyTitle>
              <EmptyDescription>
                {search ? "Try adjusting your search" : "Get started by adding your first standard"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canManage && !search && (
                <Link href="/platform/standards/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Standard
                  </Button>
                </Link>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStandards?.map((standard: Standard) => (
              <Link key={standard.id} href={`/platform/standards/${standard.id}`}>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/30 transition-all group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <BookOpen className="w-5 h-5 text-foreground" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{standard.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {standard.description || "No description provided"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { Building2, Plus, Search, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import type { Institution } from "@/lib/types"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function InstitutionsPage() {
  const { user } = useAuth()
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "INSTITUTION_ADMIN"]}>
      <InstitutionsPageContent user={user} />
    </ProtectedRoute>
  )
}

function InstitutionsPageContent({ user }: { user: { role?: string } | null }) {
  const { data: institutions, isLoading } = useSWR("institutions", () => api.getInstitutions())
  const [search, setSearch] = useState("")

  const filteredInstitutions = institutions?.filter((inst: Institution) =>
    inst.name.toLowerCase().includes(search.toLowerCase()),
  )

  const canManage = user?.role === "ADMIN" || user?.role === "INSTITUTION_ADMIN"

  return (
    <div className="min-h-screen">
      <Header
        title="Institutions"
        description="Manage educational institutions"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Institutions" },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search institutions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          {canManage && (
            <Link href="/platform/institutions/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Institution
              </Button>
            </Link>
          )}
        </div>

        {/* Institutions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-xl p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredInstitutions?.length === 0 ? (
          <Empty className="bg-card/50 border border-border rounded-xl py-16 border-solid">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No institutions found</EmptyTitle>
              <EmptyDescription>
                {search ? "Try adjusting your search" : "Get started by adding your first institution"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canManage && !search && (
                <Link href="/platform/institutions/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Institution
                  </Button>
                </Link>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstitutions?.map((institution: Institution) => (
              <Link key={institution.id} href={`/platform/institutions/${institution.id}`}>
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-foreground/20 transition-all group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Building2 className="w-5 h-5 text-foreground" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{institution.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {institution.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{institution.userCount ?? 0} users</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


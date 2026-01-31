"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useParams } from "next/navigation"
import { Building2, Users, Calendar, ArrowLeft, Edit, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function InstitutionDetailPageClient() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: institution, isLoading } = useSWR(id ? `institution-${id}` : null, () =>
    api.getInstitution(id as string),
  )

  const isAdmin = user?.role === "ADMIN"

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!institution) {
    return (
      <div className="min-h-screen">
        <Header title="Institution Not Found" />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">The institution you're looking for doesn't exist.</p>
          <Link href="/platform/institutions">
            <Button>Back to Institutions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title={institution.name} description={institution.description || undefined} />

      <div className="p-4 md:p-8 space-y-6">
        <Link
          href="/platform/institutions"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to institutions
        </Link>

        {/* Institution Info Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <Building2 className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{institution.name}</h2>
                <p className="text-muted-foreground">{institution.description || "No description"}</p>
              </div>
            </div>
            {isAdmin && (
              <Link href={`/platform/institutions/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Users</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{institution.userCount ?? 0}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Created</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {new Date(institution.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Last Updated</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {new Date(institution.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Admin Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Assign Users
              </Button>
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Link Standards
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}











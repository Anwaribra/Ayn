"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Institution, Standard } from "@/lib/types"

export default function NewAssessmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [institutionId, setInstitutionId] = useState("")
  const [standardId, setStandardId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { data: institutions } = useSWR("institutions", () => api.getInstitutions())
  const { data: standards } = useSWR("standards", () => api.getStandards())

  const isAdmin = user?.role === "ADMIN"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const selectedInstitutionId = isAdmin ? institutionId : user?.institutionId
      if (!selectedInstitutionId) {
        throw new Error("Please select an institution")
      }

      const assessment = await api.createAssessment({
        institutionId: selectedInstitutionId,
        standardId,
      })
      toast.success("Assessment created")
      router.push(`/platform/assessments/${assessment.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Create Assessment"
        description="Start a new quality assessment"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Assessments", href: "/platform/assessments" },
          { label: "New" },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-2xl">
        <Link
          href="/platform/assessments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to assessments
        </Link>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}

            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <Select value={institutionId} onValueChange={setInstitutionId}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions?.map((inst: Institution) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="standard">Standard *</Label>
              <Select value={standardId} onValueChange={setStandardId}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a standard" />
                </SelectTrigger>
                <SelectContent>
                  {standards?.map((std: Standard) => (
                    <SelectItem key={std.id} value={std.id}>
                      {std.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !standardId || (isAdmin && !institutionId)}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Assessment"
                )}
              </Button>
              <Link href="/platform/assessments">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

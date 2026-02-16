"use client"

import type React from "react"
import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { toast } from "sonner"
import useSWR from "swr"
import { DetailPageSkeleton } from "@/components/platform/detail-page-skeleton"

export function EditStandardPageClient({ standardId }: { standardId: string }) {
  const { data: standard, isLoading } = useSWR(
    standardId ? `standard-${standardId}` : null,
    () => api.getStandard(standardId),
  )
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (standard) {
      setTitle(standard.title)
      setDescription(standard.description ?? "")
    }
  }, [standard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      await api.updateStandard(standardId, { title, description })
      toast.success("Standard updated")
      router.push(`/platform/standards/${standardId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update standard")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !standard) {
    return <DetailPageSkeleton title="Loading standard..." statBlocks={0} showSecondaryBlock />
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Edit Standard"
          description={`Edit ${standard.title}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Standards", href: "/platform/standards" },
            { label: standard.title, href: `/platform/standards/${standardId}` },
            { label: "Edit" },
          ]}
        />

        <div className="p-4 md:p-[var(--spacing-content)] max-w-2xl">
          <Link
            href={`/platform/standards/${standardId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to standard
          </Link>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div id="form-error" className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Standard Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ISO 21001"
                  required
                  className="bg-background/50"
                  aria-invalid={!!error}
                  aria-describedby={error ? "form-error" : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Educational Organizations Management System..."
                  rows={4}
                  className="bg-background/50"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving || !title}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
                <Link href={`/platform/standards/${standardId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

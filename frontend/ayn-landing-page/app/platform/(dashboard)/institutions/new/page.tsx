"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { toast } from "sonner"

export default function NewInstitutionPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const institution = await api.createInstitution({ name, description })
      toast.success("Institution created")
      router.push(`/platform/institutions/${institution.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create institution")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen">
        <Header
          title="Create Institution"
          description="Add a new educational institution"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Institutions", href: "/platform/institutions" },
            { label: "New" },
          ]}
        />

        <div className="p-4 md:p-8 max-w-2xl">
          <Link
            href="/platform/institutions"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to institutions
          </Link>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div id="form-error" className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Institution Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cairo University"
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
                  placeholder="A brief description of the institution..."
                  rows={4}
                  className="bg-background/50"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || !name}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Institution"
                  )}
                </Button>
                <Link href="/platform/institutions">
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

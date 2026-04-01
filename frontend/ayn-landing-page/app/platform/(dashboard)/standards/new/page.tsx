"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  Globe,
  Layers3,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { toast } from "sonner"

const COLOR_OPTIONS = [
  { label: "Cobalt", value: "bg-[#1E3A8A]" },
  { label: "Emerald", value: "bg-[#0F766E]" },
  { label: "Amber", value: "bg-[#B45309]" },
  { label: "Rose", value: "bg-[#BE123C]" },
]

export default function NewStandardPage() {
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [region, setRegion] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedSetup, setEstimatedSetup] = useState("")
  const [color, setColor] = useState(COLOR_OPTIONS[0].value)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const summary = useMemo(
    () => ({
      code: code || "STD-LIB",
      category: category || "Uncategorized",
      region: region || "Global",
      estimatedSetup: estimatedSetup || "Not set",
    }),
    [category, code, estimatedSetup, region],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const standard = await api.createStandard({
        title,
        description,
        code,
        category,
        region,
        color,
        estimatedSetup,
      })
      toast.success("Standard created")
      router.push(`/platform/standards/${standard.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create standard")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Create Standard"
          description="Add a new framework to your standards library with the right identity from day one."
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Standards", href: "/platform/standards" },
            { label: "New" },
          ]}
        />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-3 md:px-6 xl:px-8">
          <Link
            href="/platform/standards"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to standards
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div
                    id="form-error"
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Standard Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ISO 21001"
                      required
                      className="glass-input h-12 rounded-2xl"
                      aria-invalid={!!error}
                      aria-describedby={error ? "form-error" : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Framework Code</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="ISO-21001"
                      className="glass-input h-12 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedSetup">Estimated Setup</Label>
                    <Input
                      id="estimatedSetup"
                      value={estimatedSetup}
                      onChange={(e) => setEstimatedSetup(e.target.value)}
                      placeholder="2-4 weeks"
                      className="glass-input h-12 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Educational Quality"
                      className="glass-input h-12 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Global"
                      className="glass-input h-12 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Educational Organizations Management System..."
                      rows={5}
                      className="glass-input rounded-[24px]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Color Identity</Label>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColor(option.value)}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                          color === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground"
                        }`}
                      >
                        <span className={`h-5 w-5 rounded-full ${option.value}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !title}
                    className="rounded-2xl bg-primary px-5 text-primary-foreground shadow-[0_18px_36px_-20px_rgba(37,99,235,0.45)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Standard"
                    )}
                  </Button>
                  <Link href="/platform/standards">
                    <Button type="button" variant="outline" className="glass-button rounded-2xl border-[var(--glass-border)] text-foreground">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </section>

            <aside className="space-y-4">
              <section className="glass-card rounded-[32px] p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-white shadow-lg ${color}`}>
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Preview
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-foreground">
                      {title || "New Standard"}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description || "Your framework summary will appear here as you build the standard profile."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Code</span>
                    <span className="text-sm font-semibold text-foreground">{summary.code}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <Layers3 className="h-3.5 w-3.5" />
                      Category
                    </span>
                    <span className="text-sm font-semibold text-foreground">{summary.category}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Region
                    </span>
                    <span className="text-sm font-semibold text-foreground">{summary.region}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Setup</span>
                    <span className="text-sm font-semibold text-foreground">{summary.estimatedSetup}</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

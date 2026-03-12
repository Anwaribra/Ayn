"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, FileCheck, Shield, BarChart3, Upload, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"

function EvidenceAnalyzerCard() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      await api.uploadEvidence(file)
      toast.success(`"${file.name}" uploaded and analyzed`)
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
      setDragging(false)
    }
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className="group relative flex flex-col rounded-xl border p-6 transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
        <FileCheck className="h-5 w-5 text-blue-400" />
      </div>
      <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        Evidence Analyzer
      </h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-primary)", opacity: 0.6 }}>
        Drag & drop a file for quick AI-powered evidence analysis and compliance mapping.
      </p>

      <div
        className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
        style={{
          borderColor: dragging ? "#3b82f6" : "var(--border-subtle)",
          background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        ) : (
          <>
            <Upload className="h-6 w-6 mb-2 opacity-40" style={{ color: "var(--text-primary)" }} />
            <p className="text-xs" style={{ color: "var(--text-primary)", opacity: 0.5 }}>
              Drop file here or
            </p>
            <label className="mt-1 cursor-pointer text-xs font-medium text-blue-400 hover:text-blue-300">
              browse
              <input type="file" className="hidden" onChange={onFileSelect} />
            </label>
          </>
        )}
      </div>
    </div>
  )
}

function RemediationDrafterCard() {
  const [gapId, setGapId] = useState("")
  const [institutionId, setInstitutionId] = useState("")
  const [drafting, setDrafting] = useState(false)

  async function handleDraft() {
    if (!gapId.trim() || !institutionId.trim()) {
      toast.error("Gap ID and Institution ID are required")
      return
    }
    setDrafting(true)
    try {
      const result = await api.draftDocument(gapId.trim(), institutionId.trim())
      toast.success("Remediation document drafted successfully")
      setGapId("")
      setInstitutionId("")
    } catch (err: any) {
      toast.error(err.message || "Failed to draft document")
    } finally {
      setDrafting(false)
    }
  }

  return (
    <div
      className="group relative flex flex-col rounded-xl border p-6 transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
        <Brain className="h-5 w-5 text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        Remediation Drafter
      </h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-primary)", opacity: 0.6 }}>
        Generate remediation documents to address identified compliance gaps.
      </p>

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs" style={{ color: "var(--text-primary)", opacity: 0.6 }}>
            Gap ID
          </Label>
          <Input
            placeholder="Enter gap identifier"
            value={gapId}
            onChange={(e) => setGapId(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" style={{ color: "var(--text-primary)", opacity: 0.6 }}>
            Institution ID
          </Label>
          <Input
            placeholder="Enter institution identifier"
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={handleDraft}
          disabled={drafting}
        >
          {drafting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {drafting ? "Drafting..." : "Generate Draft"}
        </Button>
      </div>
    </div>
  )
}

function LinkCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <div
      className="group relative flex flex-col rounded-xl border p-6 transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-primary)", opacity: 0.6 }}>
        {description}
      </p>
      <div className="mt-4">
        <Link href={href}>
          <Button size="sm" variant="outline" className="w-full gap-2 group-hover:border-white/20">
            {cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function AIToolsPage() {
  return (
    <div className="min-h-screen">
      <div className="px-4 pb-2 pt-6 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Tools
            </h1>
            <p className="text-sm" style={{ color: "var(--text-primary)", opacity: 0.5 }}>
              Leverage Horus AI for compliance automation
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <EvidenceAnalyzerCard />
          <RemediationDrafterCard />
          <LinkCard
            icon={Shield}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
            title="Mock Auditor"
            description="Start a practice audit session with Horus AI to prepare for real compliance audits."
            href="/platform/horus-ai/mock-audit"
            cta="Start Mock Audit"
          />
          <LinkCard
            icon={BarChart3}
            iconColor="text-rose-400"
            iconBg="bg-rose-500/10"
            title="Standards Comparator"
            description="Compare compliance coverage across standards and identify cross-framework gaps."
            href="/platform/gap-analysis"
            cta="Compare Standards"
          />
        </div>
      </div>
    </div>
  )
}

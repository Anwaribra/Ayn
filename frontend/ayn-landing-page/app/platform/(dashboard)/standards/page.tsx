"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/platform/header"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Book,
  Shield,
  Target,
  Layers,
  Activity,
  Plus,
  Sparkles,
  FileCheck,
  GraduationCap,
  Globe,
  X,
  Loader2,
} from "lucide-react"
import type { Standard } from "@/types"
import { StandardsTemplatesButton } from "@/components/platform/standards-templates"
import { WorkflowTimeline } from "@/components/platform/standards/workflow-timeline"

export default function StandardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: standards, isLoading, mutate } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
  )

  // State for the Import Standard from Document Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)
    try {
      const newStandard = await api.importStandardFromDocument({ text: importText })
      toast.success("Standard imported successfully!")
      mutate() // Refresh standards list
      setIsImportModalOpen(false)
      setImportText("")
      router.push(`/platform/standards/${newStandard.id}`)
    } catch (err) {
      toast.error("Failed to import standard")
    } finally {
      setIsImporting(false)
    }
  }

  const lifecycleSteps = [
    { id: "1", label: "Framework Definition", status: standards && standards.length > 0 ? "completed" : "current", date: "System Config" },
    { id: "2", label: "Gap Analysis", status: "pending" },
    { id: "3", label: "Evidence Mapping", status: "pending" },
    { id: "4", label: "Audit Readiness", status: "pending" },
  ] as any

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Standards Hub"
          description="Populate your institutional compliance framework"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Standards" },
          ]}
        />

        <div className="p-4 md:p-[var(--spacing-content)] space-y-8">
          {/* Workflow Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Accreditation Lifecycle</h2>
                  <p className="text-xs text-muted-foreground">Strategic milestones for current fiscal cycle</p>
                </div>
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-2xl p-6">
              <WorkflowTimeline steps={lifecycleSteps} />
            </div>
          </section>

          {/* Standard Selection Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Grid: Standard Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-md font-bold text-foreground">Active Frameworks</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all bg-muted border border-border hover:bg-muted/80 text-foreground"
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-2" />
                    Import from Document
                  </button>
                  <StandardsTemplatesButton onSelect={(template) => {
                    toast.info(`Importing ${template.name}...`)
                    api.createStandard({
                      title: template.name,
                      description: template.description,
                      code: template.code,
                      category: template.category,
                      region: template.region,
                      icon: "GraduationCap",
                      color: template.color,
                      features: template.features,
                      estimatedSetup: template.estimatedSetup
                    }).then(() => {
                      toast.success(`${template.name} added to library`)
                      mutate()
                    }).catch(() => {
                      toast.error("Failed to add standard")
                    })
                  }} />
                  <Link href="/platform/standards/new">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-9">
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Create
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-2xl border border-border" />
                  ))
                ) : (standards && standards.length > 0) ? (
                  standards.map((standard: any) => (
                    <Link key={standard.id} href={`/platform/standards/${standard.id}`}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="group relative p-6 bg-card/30 backdrop-blur-sm border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                      >
                        {/* Decorative background element */}
                        <div className={cn(
                          "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform group-hover:scale-150",
                          standard.color || "bg-primary"
                        )} />

                        <div className="flex items-start gap-4 mb-4">
                          <div className={cn(
                            "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg",
                            standard.color || "from-blue-600 to-indigo-600"
                          )}>
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {standard.title}
                            </h4>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                              {standard.code || "Standard"} • {standard.category || "General"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{standard.criteriaCount || 0}</span>
                            <span className="text-[9px] uppercase text-muted-foreground font-bold">Criteria</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span className="text-[10px] font-bold">In Progress</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h4 className="text-md font-bold text-foreground px-10">No Standards Loaded</h4>
                    <p className="text-sm text-muted-foreground mt-2">Choose a template or import a document to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Framework Topology / Intelligence Summary */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-md font-bold text-foreground">Framework Topology</h3>
              </div>

              <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Intelligence Summary</p>
                    <h4 className="text-sm font-bold text-foreground">Compliance Health</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your institution is currently aligning with <span className="text-foreground font-bold">{standards?.length || 0} frameworks</span>.
                    Recent activity highlights that <span className="text-foreground font-bold">Gap Analysis</span> is the primary bottleneck for {standards && standards.length > 0 ? standards[0]?.title : 'active standards'}.
                  </p>

                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
                      <span>Collection Status</span>
                      <span className="text-primary">64%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '64%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Standards Importer</h3>
                    <p className="text-[10px] text-muted-foreground">Paste standard contents to generate framework</p>
                  </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Document Text</Label>
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste the text from your accreditation guidelines or standard PDF here..."
                    className="h-64 bg-muted/30 border-border text-foreground font-mono text-xs resize-none"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Horus will analyze the text and extract the title, code, and individual criteria automatically.
                </p>
              </div>
              <div className="p-6 border-t border-border bg-muted/40 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !importText.trim()}
                  className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Import with AI
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  )
}

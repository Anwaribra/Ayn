"use client"

import { useState } from "react"
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
import {
  Shield,
  Layers,
  Activity,
  Target,
  Plus,
  Sparkles,
  FileCheck,
  GraduationCap,
  Globe,
  X,
  Loader2,
  FileUp,
  Search,
  Eye,
  CheckCircle2,
} from "lucide-react"
import type { Standard, Criterion } from "@/types"
import { WorkflowTimeline } from "@/components/platform/standards/workflow-timeline"

export default function StandardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: standards, isLoading, mutate } = useSWR<Standard[]>(
    "standards",
    () => api.getStandards()
  )

  // PDF Import State
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Details Modal State
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handlePDFUpload = async () => {
    if (!selectedFile) return
    setIsImporting(true)
    try {
      const newStandard = await api.importStandardPDF(selectedFile)
      toast.success(`${newStandard.title} imported successfully!`)
      mutate()
      setIsPDFModalOpen(false)
      setSelectedFile(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to import PDF")
    } finally {
      setIsImporting(false)
    }
  }

  const lifecycleSteps = [
    { id: "1", label: "Library Selection", status: "completed", date: "System Global" },
    { id: "2", label: "Evidence Alignment", status: "current" },
    { id: "3", label: "AI Gap Analysis", status: "pending" },
    { id: "4", label: "Final Report", status: "pending" },
  ] as any

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Standards Hub"
          description="Global Quality & Accreditation Library"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Standards Hub" },
          ]}
        />

        <div className="p-4 md:p-8 space-y-8">
          {/* Global Library Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900/40 border border-blue-500/20 p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="flex flex-col md:flex-row items-center gap-8 justify-between relative z-10">
              <div className="space-y-4 max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  <Globe className="w-3 h-3" />
                  Public Frameworks Enabled
                </div>
                <h2 className="text-3xl font-black text-white leading-tight">
                  Accelerate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Accreditation</span> journey.
                </h2>
                <p className="text-blue-100/70 text-sm leading-relaxed">
                  Browse a curated global library of real-world standards. Use our AI tools to analyze your institutional evidence against these frameworks instantly.
                </p>
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <Button
                    onClick={() => setIsPDFModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Import PDF Standard
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 font-bold rounded-xl"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Library
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block">
                <WorkflowTimeline steps={lifecycleSteps} />
              </div>
            </div>
          </section>

          {/* Standards Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Global Standards</h3>
                  <p className="text-xs text-slate-400">Available for cross-institutional analysis</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-64 bg-slate-800/20 animate-pulse rounded-3xl border border-white/5" />
                ))
              ) : standards && standards.length > 0 ? (
                standards.filter((s: Standard) => s.isPublic).map((standard: Standard) => (
                  <motion.div
                    key={standard.id}
                    whileHover={{ y: -5 }}
                    className="group relative flex flex-col p-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all duration-300"
                  >
                    {/* Background glow */}
                    <div className={cn(
                      "absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-20",
                      standard.color || "bg-blue-600"
                    )} />

                    <div className="flex items-start gap-4 mb-6 relative">
                      <div className={cn(
                        "p-4 rounded-2xl shadow-xl text-white bg-gradient-to-br",
                        standard.color || "from-blue-600 to-indigo-600"
                      )}>
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            {standard.code || "STD"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 truncate">
                            {standard.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {standard.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs mb-8 line-clamp-3 leading-relaxed">
                      {standard.description || "Standard guidelines for educational excellence and operational performance."}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-white leading-none">{standard.criteria?.length || 0}</span>
                          <span className="text-[10px] font-bold uppercase text-slate-500">Criteria Points</span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStandard(standard)
                            setIsDetailsOpen(true)
                          }}
                          className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                          <Activity className="w-3.5 h-3.5 mr-2" />
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
                  <Search className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white">No standards available</h4>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">The global library is currently being updated. Check back shortly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Import Modal */}
      <AnimatePresence>
        {isPDFModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI PDF Importer</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Public Library Growth</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsPDFModalOpen(false)
                    setSelectedFile(null)
                  }}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300",
                    selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800 hover:border-blue-500/50 bg-slate-800/10"
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                      <p className="text-sm font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                      <button onClick={() => setSelectedFile(null)} className="text-[10px] text-rose-500 font-bold mt-2 uppercase underline underline-offset-4">Change File</button>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-sm font-bold text-slate-400">Click to upload standard PDF</p>
                      <p className="text-[10px] text-slate-600 mt-2">Maximum size 10MB</p>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <p className="text-[10px] text-blue-200/60 leading-relaxed font-medium">
                      Horus AI will scan the PDF to detect hierarchy, clauses, and criteria points. Once processed, it will be added to the Global Library for everyone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsPDFModalOpen(false)}
                  className="rounded-xl text-slate-400 hover:bg-slate-800 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePDFUpload}
                  disabled={isImporting || !selectedFile}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standard Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedStandard && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 shadow-2xl rounded-[32px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -rotate-3",
                    selectedStandard.color || "bg-blue-600"
                  )}>
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{selectedStandard.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{selectedStandard.code}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-xs font-bold text-slate-500">{selectedStandard.category}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-xs font-bold text-slate-500">{selectedStandard.region}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-3 hover:bg-slate-800 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Criteria Evidence Framework
                    </h4>
                    <div className="space-y-4">
                      {selectedStandard.criteria && selectedStandard.criteria.length > 0 ? (
                        selectedStandard.criteria.map((crit: Criterion) => (
                          <div key={crit.id} className="p-6 rounded-[24px] bg-slate-800/40 border border-white/5 hover:border-blue-500/20 transition-all">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-[10px] flex-shrink-0">
                                {crit.title.split(' ')[0]}
                              </div>
                              <div>
                                <h5 className="text-md font-bold text-white mb-2">{crit.title}</h5>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                  {crit.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center bg-slate-800/20 rounded-[24px] border border-dashed border-slate-700">
                          <p className="text-slate-500 font-bold">No mapped criteria points found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-[28px] bg-blue-600/10 border border-blue-500/20 space-y-4 shadow-inner">
                      <h5 className="text-sm font-black text-white uppercase flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Ayn Intelligence
                      </h5>
                      <p className="text-xs text-blue-100/60 leading-relaxed">
                        This framework is fully compatible with our <span className="text-white font-black">Multi-Modal Gap Analysis</span> engine.
                      </p>
                      <Button
                        onClick={() => {
                          setIsDetailsOpen(false)
                          router.push(`/platform/gap-analysis?standardId=${selectedStandard.id}`)
                        }}
                        className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 text-sm"
                      >
                        Analyze Now
                      </Button>
                    </div>

                    <div className="p-6 rounded-[28px] bg-slate-800/40 border border-white/5 space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Standard Coverage</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">Full Compatibility</span>
                          <span className="text-xs font-black text-emerald-400">100%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  )
}

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

        <div className="p-4 md:p-10 space-y-10 max-w-7xl mx-auto">
          {/* Main Hero Banner */}
          <section className="relative overflow-hidden rounded-[40px] bg-slate-100 border border-slate-200 p-10 md:p-14 shadow-sm">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center relative z-10">
              <div className="lg:col-span-3 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                    Ayn Intelligence Framework v4.0
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  Accelerate your <br />
                  <span className="text-blue-600">Accreditation</span> journey.
                </h2>

                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                  Browse a curated global library of real-world standards. Use our AI tools to analyze your institutional evidence against these frameworks instantly.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Button
                    onClick={() => setIsPDFModalOpen(true)}
                    className="h-14 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-2xl px-8 shadow-lg shadow-blue-900/20 flex items-center gap-3 transition-all active:scale-95"
                  >
                    <FileUp className="w-5 h-5" />
                    <span className="text-base">Import PDF Standard</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-2xl px-8 shadow-sm flex items-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-base font-black uppercase tracking-wider text-xs">Browse Library</span>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2 flex justify-center lg:justify-end">
                <div className="bg-white/50 backdrop-blur-sm border border-slate-200 p-8 rounded-[32px] shadow-sm w-full max-w-sm">
                  <WorkflowTimeline steps={lifecycleSteps} />
                </div>
              </div>
            </div>
          </section>

          {/* Standards Grid Section */}
          <div className="space-y-8 pt-6">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Standards Intelligence</h3>
                </div>
                <h4 className="text-2xl font-black text-slate-900">Institutional Frameworks</h4>
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
                    className="group relative flex flex-col pt-10 pb-6 px-10 bg-white border border-slate-200 rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
                  >
                    <div className="flex flex-col h-full">
                      {/* Header Segment */}
                      <div className="flex items-start gap-4 mb-8">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                          standard.color || "bg-blue-600 shadow-blue-500/20"
                        )}>
                          <GraduationCap className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                            {standard.code || "Standard Library"}
                          </h3>
                          <h4 className="text-2xl font-black text-slate-900 leading-tight truncate">
                            {standard.title}
                          </h4>
                        </div>
                      </div>

                      {/* Content Segment */}
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 line-clamp-3">
                        {standard.description || "Comprehensive accreditation standards and institutional frameworks for quality assurance and performance monitoring."}
                      </p>

                      {/* Action Segment */}
                      <div className="space-y-4 mb-10">
                        <Button
                          onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                          className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-base shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          Generate Compliance Briefing
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStandard(standard)
                            setIsDetailsOpen(true)
                          }}
                          className="w-full text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 font-bold uppercase text-[10px] tracking-widest h-8"
                        >
                          View Framework Details
                        </Button>
                      </div>

                      {/* Status Segment */}
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            AYN CORE LIVE SYNC
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-base font-black text-blue-600 leading-none">{standard.criteria?.length || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Active Criteria</span>
                        </div>
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
              className="w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 shadow-2xl rounded-[40px] overflow-hidden flex flex-col"
            >
              <div className="p-10 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -rotate-3",
                    selectedStandard.color || "bg-blue-600"
                  )}>
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{selectedStandard.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{selectedStandard.code}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedStandard.category}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-3 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Criteria Evidence Framework
                    </h4>
                    <div className="space-y-4">
                      {selectedStandard.criteria && selectedStandard.criteria.length > 0 ? (
                        selectedStandard.criteria.map((crit: Criterion) => (
                          <div key={crit.id} className="p-8 rounded-[32px] bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
                            <div className="flex items-start gap-6">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                {crit.title.split(' ')[0]}
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-lg font-black text-slate-900">{crit.title}</h5>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
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
                    <div className="p-8 rounded-[32px] bg-blue-600 text-white space-y-4 shadow-xl shadow-blue-500/20">
                      <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-80">
                        <Sparkles className="w-4 h-4" />
                        Ayn Intelligence
                      </h5>
                      <p className="text-base font-medium leading-relaxed">
                        This framework is fully compatible with our <span className="font-black underline decoration-white/30">Multi-Modal Gap Analysis</span> engine.
                      </p>
                      <Button
                        onClick={() => {
                          setIsDetailsOpen(false)
                          router.push(`/platform/gap-analysis?standardId=${selectedStandard.id}`)
                        }}
                        className="w-full h-14 rounded-2xl bg-white text-blue-600 hover:bg-slate-50 font-black text-sm uppercase tracking-wider"
                      >
                        Analyze Now
                      </Button>
                    </div>

                    <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-200 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Standard Coverage</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-900 uppercase">Framework Match</span>
                          <span className="text-xs font-black text-emerald-600">PASSED</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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

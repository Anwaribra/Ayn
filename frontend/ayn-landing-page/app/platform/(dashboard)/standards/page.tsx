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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all") // all, popular, recent

  const filteredStandards = standards?.filter((s: Standard) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch && s.isPublic
    if (activeTab === "popular") return matchesSearch && s.isPublic && (s.criteria?.length || 0) > 30
    if (activeTab === "recent") return matchesSearch && s.isPublic // Simplified for now
    return matchesSearch
  })

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

        <div className="w-full">
          {/* 1. HERO SECTION (Full Width) */}
          <section className="w-full bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-16 px-6 md:px-12 lg:px-20 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] -z-10" />

            <div className="max-w-7xl mx-auto space-y-10">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  Standards Hub <span className="text-slate-400 dark:text-slate-600 font-light">—</span> <span className="text-blue-600 dark:text-blue-500">Global Quality Library</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl">
                  AI-powered accreditation frameworks from around the world. Streamline your institutional compliance with automated mapping.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 max-w-4xl">
                <div className="relative flex-1 w-full text-foreground">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search standards by name, code or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-12 pr-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <Button
                  onClick={() => setIsPDFModalOpen(true)}
                  className="h-16 px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  <FileUp className="w-5 h-5" />
                  <span className="text-lg text-white">Import Framework</span>
                </Button>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 space-y-12">
            {/* 2. TABS SECTION */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              {[
                { id: "popular", label: "Popular" },
                { id: "all", label: "All Frameworks" },
                { id: "recent", label: "Recently Added" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-3 rounded-t-xl font-bold uppercase text-[11px] tracking-widest transition-all relative",
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                      : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3. STANDARD GRID (2 Large Cards per Row) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-[280px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[40px] border border-slate-100 dark:border-slate-800" />
                ))
              ) : filteredStandards && filteredStandards.length > 0 ? (
                filteredStandards.map((standard: Standard) => (
                  <motion.div
                    key={standard.id}
                    whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(30, 58, 138, 0.2)" }}
                    className="group flex flex-col p-10 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[44px] transition-all duration-500 min-h-[300px]"
                  >
                    <div className="flex-1 flex flex-col space-y-6">
                      {/* Top Segment: Icon + Name (24px) + Criteria */}
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-5">
                          <div className={cn(
                            "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg",
                            standard.color || "bg-[#1E3A8A]"
                          )}>
                            <GraduationCap className="w-9 h-9 text-white" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-[24px] font-black text-slate-900 dark:text-white leading-[1.1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {standard.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{standard.code || "STD-LIB"}</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{standard.criteria?.length || 0} Criteria Points</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                            Live Framework
                          </div>
                        </div>
                      </div>

                      {/* Middle Segment: Description (2 lines max) */}
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed line-clamp-2 pr-4">
                        {standard.description || "Comprehensive accreditation standards and institutional frameworks for global quality assurance and performance monitoring."}
                      </p>

                      {/* Bottom Segment: Buttons */}
                      <div className="grid grid-cols-2 gap-4 pt-6 mt-auto">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedStandard(standard)
                            setIsDetailsOpen(true)
                          }}
                          className="h-14 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2"
                        >
                          <Eye className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">View Details</span>
                        </Button>
                        <Button
                          onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                          className="h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          <Activity className="w-5 h-5 text-white" />
                          <span className="text-white">Start Analysis</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[44px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6 border border-slate-200 dark:border-slate-700">
                    <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">No frameworks found</h4>
                  <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto font-medium">Try adjusting your search query or switching tabs to find what you're looking for.</p>
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
              className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[40px] overflow-hidden flex flex-col"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -rotate-3",
                    selectedStandard.color || "bg-blue-600"
                  )}>
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{selectedStandard.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{selectedStandard.code}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{selectedStandard.category}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar dark:bg-slate-900/40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Criteria Evidence Framework
                    </h4>
                    <div className="space-y-4">
                      {selectedStandard.criteria && selectedStandard.criteria.length > 0 ? (
                        selectedStandard.criteria.map((crit: Criterion) => (
                          <div key={crit.id} className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
                            <div className="flex items-start gap-6">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                {crit.title.split(' ')[0]}
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-lg font-black text-slate-900 dark:text-white">{crit.title}</h5>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
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

                    <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Standard Coverage</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Framework Match</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">PASSED</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 dark:bg-emerald-600" style={{ width: '100%' }} />
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

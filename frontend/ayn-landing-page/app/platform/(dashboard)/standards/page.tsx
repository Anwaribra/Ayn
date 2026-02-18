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
  Upload,
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
          <section className="w-full py-16 px-6 md:px-12 lg:px-20 relative overflow-hidden transition-all duration-300"
            style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-[160px] -z-10" />

            <div className="max-w-7xl mx-auto space-y-10">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
                  Standards Hub <span style={{ color: 'var(--border-color)' }} className="font-light">—</span> <br />
                  <span className="text-blue-600 dark:text-blue-500">Global Quality Library</span>
                </h1>
                <p className="text-xl font-medium max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  AI-powered accreditation frameworks from around the world. Streamline your institutional compliance with automated mapping.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 max-w-4xl">
                <div className="relative flex-1 w-full group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search standards by name, code or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 transition-all font-bold placeholder:text-slate-400 focus:ring-8 focus:ring-blue-500/5 outline-none"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <Button
                  onClick={() => setIsPDFModalOpen(true)}
                  className="h-16 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                >
                  <FileUp className="w-5 h-5 text-white" />
                  <span className="text-lg">Import Framework</span>
                </Button>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 space-y-12">
            {/* 2. TABS SECTION */}
            <div className="flex flex-wrap items-center gap-4 border-b pb-px" style={{ borderColor: 'var(--border-color)' }}>
              {[
                { id: "popular", label: "Popular" },
                { id: "all", label: "All Frameworks" },
                { id: "recent", label: "Recently Added" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-4 font-black uppercase text-[12px] tracking-widest transition-all relative border-b-4",
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500"
                      : "text-slate-500 hover:text-slate-900 border-transparent"
                  )}
                  style={{ color: activeTab === tab.id ? undefined : 'var(--text-secondary)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3. STANDARD GRID (2 Large Cards per Row) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-[280px] animate-pulse rounded-[40px] border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                ))
              ) : filteredStandards && filteredStandards.length > 0 ? (
                filteredStandards.map((standard: Standard) => (
                  <motion.div
                    key={standard.id}
                    whileHover={{ y: -10, scale: 1.01 }}
                    className="group flex flex-col p-12 border rounded-[48px] transition-all duration-500 min-h-[320px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-blue-500/10"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-card)'
                    }}
                  >
                    <div className="flex-1 flex flex-col space-y-8">
                      {/* Top Segment: Icon + Name (24px) + Criteria */}
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shrink-0 shadow-lg",
                            standard.color || "bg-[#1E3A8A]"
                          )}>
                            <GraduationCap className="w-9 h-9 text-white" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-[26px] font-black leading-[1.1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                              {standard.title}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{standard.code || "STD-LIB"}</span>
                              <span style={{ color: 'var(--border-color)' }} className="font-light">|</span>
                              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{standard.criteria?.length || 0} Criteria Points</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest"
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981'
                            }}>
                            Active
                          </div>
                        </div>
                      </div>

                      {/* Middle Segment: Description (2 lines max) */}
                      <p className="text-lg font-medium leading-relaxed line-clamp-2 pr-6" style={{ color: 'var(--text-secondary)' }}>
                        {standard.description || "Comprehensive accreditation standards and institutional frameworks for global quality assurance and performance monitoring."}
                      </p>

                      {/* Bottom Segment: Buttons */}
                      <div className="grid grid-cols-2 gap-5 pt-8 mt-auto">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedStandard(standard)
                            setIsDetailsOpen(true)
                          }}
                          className="h-14 border-2 font-black rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                          style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <Eye className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                          <span>View Details</span>
                        </Button>
                        <Button
                          onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                          className="h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          <Activity className="w-5 h-5 text-white" />
                          <span>Start Analysis</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center rounded-[44px] border-2 border-dashed"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6 border"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h4 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>No frameworks found</h4>
                  <p className="mt-2 max-w-sm mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search query or switching tabs to find what you're looking for.</p>
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg p-10 border shadow-2xl rounded-[40px] relative overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[24px] flex items-center justify-center">
                  <FileUp className="w-10 h-10 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Import Framework</h3>
                  <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Upload your framework PDF for AI analysis.</p>
                </div>

                <div className="w-full p-8 border-2 border-dashed rounded-[32px] transition-colors group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  style={{ borderColor: 'var(--border-color)' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      <p className="text-sm font-bold text-white truncate max-w-xs mx-auto">{selectedFile.name}</p>
                      <button onClick={() => setSelectedFile(null)} className="text-[10px] text-rose-500 font-bold mt-2 uppercase underline underline-offset-4">Change File</button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Select PDF File</p>
                    </>
                  )}
                </div>

                <div className="flex gap-4 w-full pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPDFModalOpen(false)
                      setSelectedFile(null)
                    }}
                    className="flex-1 h-14 border-2 font-black rounded-2xl"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePDFUpload}
                    disabled={isImporting || !selectedFile}
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 mr-2" />
                        Upload & Extract
                      </>
                    )}
                  </Button>
                </div>
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
              className="w-full max-w-5xl max-h-[90vh] shadow-2xl rounded-[40px] overflow-hidden flex flex-col border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="p-10 border-b flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -rotate-3",
                    selectedStandard.color || "bg-[#1E3A8A]"
                  )}>
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{selectedStandard.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{selectedStandard.code}</span>
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border-color)' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{selectedStandard.category}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Criteria Evidence Framework
                    </h4>
                    <div className="space-y-4">
                      {selectedStandard.criteria && selectedStandard.criteria.length > 0 ? (
                        selectedStandard.criteria.map((crit: Criterion) => (
                          <div key={crit.id} className="p-8 rounded-[32px] border hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-start gap-6">
                              <div className="w-10 h-10 rounded-xl border flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                {crit.title.split(' ')[0]}
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{crit.title}</h5>
                                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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

                    <div className="p-8 rounded-[32px] border space-y-4 shadow-sm"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: 'var(--text-secondary)' }}>Standard Coverage</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase" style={{ color: 'var(--text-primary)' }}>Framework Match</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">PASSED</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
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

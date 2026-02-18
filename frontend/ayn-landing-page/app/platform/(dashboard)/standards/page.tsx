"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/platform/header"
import {
  Activity,
  Sparkles,
  FileCheck,
  GraduationCap,
  X,
  Loader2,
  FileUp,
  Search,
  Eye,
  CheckCircle2,
  Upload,
} from "lucide-react"
import type { Standard, Criterion } from "@/types"
import { AmbientBackground } from "@/components/ui/ambient-background"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassPanel } from "@/components/ui/glass-panel"

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-background">
        <AmbientBackground />

        <div className="relative z-10">
          <Header
            title="Standards Hub"
            description="Global Quality & Accreditation Library"
            breadcrumbs={[
              { label: "Dashboard", href: "/platform/dashboard" },
              { label: "Standards Hub" },
            ]}
          />

          <div className="w-full">
            {/* 1. HERO SECTION (Translucent Glass) */}
            <section className="w-full py-16 px-6 md:px-12 lg:px-20 relative z-10 transition-all duration-300">
              <div className="max-w-7xl mx-auto">
                <div className="glass-card p-10 md:p-16 rounded-[48px] border-white/20 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-subtle" />

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
                        Standards Hub <span className="text-muted-foreground font-light">—</span> <br />
                        <span className="text-primary">Global Quality Library</span>
                      </h1>
                      <p className="text-xl font-medium max-w-2xl leading-relaxed text-muted-foreground">
                        AI-powered accreditation frameworks from around the world. Streamline your institutional compliance with automated mapping.
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 max-w-4xl">
                      <div className="relative flex-1 w-full group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          placeholder="Search standards by name, code or category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 bg-background/50 backdrop-blur-sm transition-all font-bold placeholder:text-muted-foreground focus:ring-8 focus:ring-primary/5 outline-none border-border group-focus-within:border-primary/50"
                        />
                      </div>
                      <Button
                        onClick={() => setIsPDFModalOpen(true)}
                        className="h-16 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/20"
                      >
                        <FileUp className="w-5 h-5" />
                        <span className="text-lg">Import Framework</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 space-y-12">
              {/* 2. TABS SECTION */}
              <div className="flex flex-wrap items-center gap-4 border-b pb-px border-border">
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
                        ? "text-primary border-primary"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 3. STANDARD GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-[1]">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-[320px] animate-pulse rounded-[48px] border bg-muted/20 border-border" />
                  ))
                ) : filteredStandards && filteredStandards.length > 0 ? (
                  filteredStandards.map((standard: Standard) => (
                    <GlassCard
                      key={standard.id}
                      variant={2}
                      hoverEffect
                      shine
                      className="group border-white/20 dark:border-white/10 rounded-[48px] min-h-[320px] p-12"
                    >
                      <div className="flex-1 flex flex-col space-y-8 relative z-10">
                        {/* Top Segment */}
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex items-start gap-6">
                            <div className={cn(
                              "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shrink-0 shadow-lg",
                              standard.color || "bg-[#1E3A8A]"
                            )}>
                              <GraduationCap className="w-9 h-9 text-white" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-[26px] font-black leading-[1.1] group-hover:text-primary transition-colors text-foreground">
                                {standard.title}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{standard.code || "STD-LIB"}</span>
                                <span className="font-light text-border">|</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{standard.criteria?.length || 0} Criteria Points</span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden sm:block">
                            <div className="px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              Active
                            </div>
                          </div>
                        </div>

                        {/* Middle Segment */}
                        <p className="text-lg font-medium leading-relaxed line-clamp-2 pr-6 text-muted-foreground">
                          {standard.description || "Comprehensive accreditation standards and institutional frameworks for global quality assurance and performance monitoring."}
                        </p>

                        {/* Bottom Segment */}
                        <div className="grid grid-cols-2 gap-5 pt-8 mt-auto">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedStandard(standard)
                              setIsDetailsOpen(true)
                            }}
                            className="h-14 border-2 font-black rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-muted/50 border-border text-foreground bg-transparent"
                          >
                            <Eye className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            <span>View Details</span>
                          </Button>
                          <Button
                            onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                            className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                          >
                            <Activity className="w-5 h-5" />
                            <span>Start Analysis</span>
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                ) : (
                  <GlassPanel className="col-span-full py-32 text-center border-2 border-dashed border-border" hoverEffect>
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6 border border-border bg-background/50">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-2xl font-black text-foreground">No frameworks found</h4>
                    <p className="mt-2 max-w-sm mx-auto font-medium text-muted-foreground">Try adjusting your search query or switching tabs to find what you're looking for.</p>
                  </GlassPanel>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Import Modal */}
        <AnimatePresence>
          {isPDFModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <GlassCard
                variant={3}
                className="w-full max-w-lg p-10 border-white/20 dark:border-white/10 rounded-[40px] relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center">
                    <FileUp className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-foreground">Import Framework</h3>
                    <p className="font-medium text-muted-foreground">Upload your framework PDF for AI analysis.</p>
                  </div>

                  <div className="w-full p-8 border-2 border-dashed rounded-[32px] transition-colors group cursor-pointer hover:bg-muted/50 border-border">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {selectedFile ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <p className="text-sm font-bold text-foreground truncate max-w-xs mx-auto">{selectedFile.name}</p>
                        <button onClick={() => setSelectedFile(null)} className="text-[10px] text-destructive font-bold mt-2 uppercase underline underline-offset-4">Change File</button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Select PDF File</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 w-full pt-4">
                    <Button variant="outline" onClick={() => { setIsPDFModalOpen(false); setSelectedFile(null); }}
                      className="flex-1 h-14 border-2 font-black rounded-2xl border-border text-foreground bg-transparent">
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePDFUpload}
                      disabled={isImporting || !selectedFile}
                      className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20"
                    >
                      {isImporting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><FileCheck className="w-4 h-4 mr-2" />Upload & Extract</>
                      )}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </AnimatePresence>

        {/* Standard Details Modal */}
        <AnimatePresence>
          {isDetailsOpen && selectedStandard && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl">
              <GlassCard
                variant={4}
                className="w-full max-w-5xl max-h-[90vh] shadow-2xl rounded-[40px] overflow-hidden flex flex-col border-white/20 dark:border-white/10"
              >
                <div className="p-10 border-b flex items-center justify-between border-border bg-background/30 backdrop-blur-md">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -rotate-3",
                      selectedStandard.color || "bg-[#1E3A8A]"
                    )}>
                      <GraduationCap className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-foreground">{selectedStandard.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedStandard.code}</span>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{selectedStandard.category}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsDetailsOpen(false)} className="p-3 hover:bg-muted/50 rounded-2xl transition-all">
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-card/20">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-muted-foreground">
                        <Activity className="w-4 h-4 text-primary" />
                        Criteria Evidence Framework
                      </h4>
                      <div className="space-y-4">
                        {selectedStandard.criteria && selectedStandard.criteria.length > 0 ? (
                          selectedStandard.criteria.map((crit: Criterion) => (
                            <GlassPanel key={crit.id} className="p-8 rounded-[32px] border-white/10 hover:border-primary/30 transition-all group" hoverEffect>
                              <div className="flex items-start gap-6 relative z-10">
                                <div className="w-10 h-10 rounded-xl border flex items-center justify-center text-primary font-black text-xs flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform bg-background/50 border-border">
                                  {crit.title.split(' ')[0]}
                                </div>
                                <div className="space-y-2">
                                  <h5 className="text-lg font-black text-foreground">{crit.title}</h5>
                                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">{crit.description}</p>
                                </div>
                              </div>
                            </GlassPanel>
                          ))
                        ) : (
                          <div className="p-10 text-center bg-muted/10 rounded-[24px] border border-dashed border-border">
                            <p className="text-muted-foreground font-bold">No mapped criteria points found.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 rounded-[32px] bg-primary text-primary-foreground space-y-4 shadow-xl shadow-primary/20">
                        <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-80">
                          <Sparkles className="w-4 h-4" />
                          Ayn Intelligence
                        </h5>
                        <p className="text-base font-medium leading-relaxed">
                          This framework is fully compatible with our <span className="font-black underline decoration-white/30">Multi-Modal Gap Analysis</span> engine.
                        </p>
                        <Button
                          onClick={() => { setIsDetailsOpen(false); router.push(`/platform/gap-analysis?standardId=${selectedStandard.id}`); }}
                          className="w-full h-14 rounded-2xl bg-background text-primary hover:bg-muted font-black text-sm uppercase tracking-wider"
                        >
                          Analyze Now
                        </Button>
                      </div>

                      <GlassPanel className="p-8 rounded-[32px] space-y-4 shadow-sm border-white/10" hoverEffect>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none text-muted-foreground">Standard Coverage</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase text-foreground">Framework Match</span>
                            <span className="text-xs font-black text-emerald-500">PASSED</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                            <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </GlassPanel>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}

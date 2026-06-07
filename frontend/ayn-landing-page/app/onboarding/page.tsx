"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { DarkCardNeuralBg } from "@/components/landing/dark-card-neural-bg"
import { AynLogo } from "@/components/ayn-logo"
import { useAuth } from "@/lib/auth-context"
import {
  ArrowLeft, ArrowRight, Check, Building2, GraduationCap,
  School, Building, Library, Sparkles, Rocket, Loader2,
  Globe, BookOpen, Scale, Microscope, Brain,
  LayoutDashboard, Settings, FileText, Activity, Users,
} from "lucide-react"

const INSTITUTION_TYPES = [
  { id: "university", label: "University", icon: GraduationCap },
  { id: "college", label: "College", icon: Library },
  { id: "institute", label: "Institute", icon: Building },
  { id: "school", label: "School", icon: School },
  { id: "other", label: "Other", icon: Building2 },
] as const

const STANDARDS = [
  { id: "iso-21001", label: "ISO 21001", desc: "Education management" },
  { id: "ncaaa", label: "NCAAA", desc: "National academic accreditation" },
  { id: "abet", label: "ABET", desc: "Engineering & technology" },
  { id: "qs-stars", label: "QS Stars", desc: "Global university rating" },
  { id: "efqm", label: "EFQM", desc: "Excellence framework" },
  { id: "moe", label: "MOE Frameworks", desc: "Ministry of Education" },
] as const

const STEPS = [
  { title: "Welcome", subtitle: "Let's get started" },
  { title: "Institution", subtitle: "Name your workspace" },
  { title: "Type", subtitle: "What best describes you?" },
  { title: "Scale", subtitle: "Departments & faculties" },
  { title: "Standards", subtitle: "Select compliance needs" },
  { title: "Ready", subtitle: "Launch your workspace" },
]

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface OnboardingPreviewProps {
  step: number
  instName: string
  instType: string
  deptCount: number
  selectedStandards: string[]
}

function OnboardingPreview({
  step,
  instName,
  instType,
  deptCount,
  selectedStandards,
}: OnboardingPreviewProps) {
  const slug = instName ? slugify(instName) : "your-workspace"
  
  const TypeIcon = useMemo(() => {
    switch (instType) {
      case "university": return GraduationCap
      case "college": return Library
      case "institute": return Building
      case "school": return School
      default: return Building2
    }
  }, [instType])

  const initials = instName ? getInitials(instName) : "AYN"

  return (
    <div className="relative w-full h-[540px] flex flex-col rounded-[24px] border border-white/10 bg-white/[0.02] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden font-dmsans select-none group">
      <div className="absolute inset-0 border border-white/5 rounded-[24px] pointer-events-none" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-1.5 w-1/4">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-center w-2/4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] text-white/50 font-mono truncate max-w-[280px]">
            <Globe className="w-3 h-3 text-primary shrink-0" />
            <span>{slug}</span>
            <span className="text-white/20">.ayn.qa</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-0.5" />
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 w-1/4">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider hidden sm:inline">Active Setup</span>
          <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[9px] font-bold text-primary">
            {initials}
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Mock */}
        <div className="w-[52px] border-r border-white/10 bg-white/[0.01] flex flex-col items-center py-4 gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
            <Activity className="w-4 h-4" />
          </div>
          <div className="mt-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
            <Settings className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-black/20">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              
              {/* STEP 0: Welcome */}
              {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/25 blur-xl rounded-full scale-125 animate-pulse" />
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-lg flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">Horus QA Core Ready</h3>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Welcome to Ayn&apos;s setup workspace. Configure your institution profile to dynamically generate syllabus structures, department portals, and compliance mappings.
                  </p>
                  <div className="mt-4 flex gap-1.5">
                    <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/40">Status: Standby</div>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary">Horus V2</div>
                  </div>
                </div>
              )}

              {/* STEP 1: Institution Name */}
              {step === 1 && (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] max-w-md mx-auto w-full shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Workspace Configuration</span>
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-white/40 block mb-1">Institution Registered Name</label>
                        <div className="h-9 px-3 rounded-lg bg-black/40 border border-white/5 flex items-center text-xs font-semibold text-white/80 transition-all truncate">
                          {instName || <span className="text-white/20 font-normal italic">Enter name on left...</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-white/40 text-[9px]">Workspace URL</p>
                          <p className="font-semibold text-white/80 truncate mt-0.5">{slug}.ayn.qa</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-white/40 text-[9px]">Server Region</p>
                          <p className="font-semibold text-white/80 mt-0.5">ayn-node-east-01</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Institution Type */}
              {step === 2 && (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="max-w-md mx-auto w-full space-y-3.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <TypeIcon className="w-4 h-4 animate-bounce animate-duration-1000" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white capitalize">{instType || "Configure Type"} Layout</h4>
                        <p className="text-[9px] text-white/40">Custom workspace blueprint activated</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {instType === "university" ? (
                        <>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <GraduationCap className="w-4 h-4 text-primary mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Faculties</p>
                            <p className="text-[8px] text-white/40 mt-1">Academic degree mappings</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <BookOpen className="w-4 h-4 text-emerald-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Curriculums</p>
                            <p className="text-[8px] text-white/40 mt-1">Course specifications</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <Users className="w-4 h-4 text-blue-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Council</p>
                            <p className="text-[8px] text-white/40 mt-1">Academic review board</p>
                          </div>
                        </>
                      ) : instType === "school" ? (
                        <>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <School className="w-4 h-4 text-primary mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Grades</p>
                            <p className="text-[8px] text-white/40 mt-1">Classroom scheduling</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <BookOpen className="w-4 h-4 text-emerald-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Syllabus</p>
                            <p className="text-[8px] text-white/40 mt-1">Weekly lesson plans</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <Users className="w-4 h-4 text-blue-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Staff</p>
                            <p className="text-[8px] text-white/40 mt-1">Teacher registry & load</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <Building2 className="w-4 h-4 text-primary mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Units</p>
                            <p className="text-[8px] text-white/40 mt-1">Organizational division</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <FileText className="w-4 h-4 text-emerald-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Standards</p>
                            <p className="text-[8px] text-white/40 mt-1">Quality audits setup</p>
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-left">
                            <Users className="w-4 h-4 text-blue-400 mb-1.5" />
                            <p className="text-[10px] font-semibold text-white/80 leading-none">Auditors</p>
                            <p className="text-[8px] text-white/40 mt-1">Peer reviews roster</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Scale / Departments */}
              {step === 3 && (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="max-w-md mx-auto w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Department Map preview</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold">{deptCount} Active Nodes</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                      <AnimatePresence mode="popLayout">
                        {Array.from({ length: Math.min(deptCount, 12) }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/70"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">Department {i + 1}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {deptCount > 12 && (
                        <div className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-[9px] text-primary font-semibold">
                          + {deptCount - 12} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Standards */}
              {step === 4 && (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="max-w-md mx-auto w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Accreditation Shields</span>
                      <span className="text-[10px] text-white/40 font-semibold">{selectedStandards.length} Selected</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {STANDARDS.map((s) => {
                        const isSelected = selectedStandards.includes(s.id)
                        return (
                          <div
                            key={s.id}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-300",
                              isSelected
                                ? "bg-primary/10 border-primary/40 text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                                : "bg-white/5 border-white/10 text-white/40"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                                isSelected ? "bg-primary text-white" : "bg-white/15 text-white/40"
                              )}
                            >
                              {isSelected ? <Check className="w-2.5 h-2.5" /> : "•"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold leading-none truncate">{s.label}</p>
                              <p className="text-[8px] opacity-75 mt-0.5 leading-none truncate">{s.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Launch / Ready */}
              {step === 5 && (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="max-w-md mx-auto w-full space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Dashboard Active Live-Feed</span>
                      <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Audit Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg border border-white/10 bg-white/[0.03] flex flex-col justify-between">
                        <span className="text-[9px] text-white/40">Compliance Progress</span>
                        <span className="text-xl font-bold text-white mt-1">100%</span>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-emerald-400 rounded-full w-full" />
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-white/10 bg-white/[0.03] flex flex-col justify-between">
                        <span className="text-[9px] text-white/40">Mapped Standards</span>
                        <span className="text-xl font-bold text-primary mt-1">{selectedStandards.length} Mapped</span>
                        <span className="text-[8px] text-white/30 mt-2 truncate">
                          {selectedStandards.map(s => s.toUpperCase()).join(", ")}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-r from-primary/10 to-blue-500/10 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white">Horus AI Assistant</p>
                        <p className="text-[9px] text-white/60 mt-0.5 leading-relaxed">
                          &quot;I have generated the workspace blueprints for <strong className="text-white">{instName || "your institution"}</strong> with {deptCount} departments. Press &apos;Create Workspace&apos; to initialize!&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[8px] text-white/30 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Blueprints configured
            </span>
            <span>Ayn Platform v2.1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [instName, setInstName] = useState("")
  const [instType, setInstType] = useState("")
  const [deptCount, setDeptCount] = useState(3)
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [user, authLoading, router])

  const goNext = useCallback(() => {
    setDirection(1)
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }, [])

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return true
      case 1: return instName.trim().length >= 2
      case 2: return instType.length > 0
      case 3: return true
      case 4: return selectedStandards.length > 0
      case 5: return true
      default: return false
    }
  }, [step, instName, instType, selectedStandards])

  const handleCreate = async () => {
    if (!user) return
    setIsCreating(true)
    try {
      const institution = await api.createInstitution({
        name: instName.trim(),
        description: `${instType} — ${deptCount} departments · ${selectedStandards.length} standards`,
      })
      await api.assignUserToInstitution(institution.id, user.id)
      await refreshUser()
      setIsCompleted(true)
      setTimeout(() => router.push("/platform/dashboard"), 1600)
    } catch {
      try {
        const institutions = await api.getInstitutions()
        const myInst = institutions[0]
        if (myInst) {
          await api.updateInstitution(myInst.id, {
            name: instName.trim(),
            description: `${instType} — ${deptCount} departments · ${selectedStandards.length} standards`,
          })
          await refreshUser()
          setIsCompleted(true)
          setTimeout(() => router.push("/platform/dashboard"), 1600)
        }
      } catch {
        setTimeout(() => router.push("/platform/dashboard"), 800)
      }
    }
  }

  const toggleStandard = (id: string) => {
    setSelectedStandards(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const pageVariants = {
    enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
  }

  if (authLoading || !user) return null

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A]">
      <DarkCardNeuralBg />
      <div className="dark-card-edge-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl xl:max-w-7xl flex-col px-4 sm:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-5 pb-2 sm:pb-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <AynLogo size="nav" withGlow={false} variant="on-dark" isArabic={false} />
          <div className="w-5" />
        </div>

        {/* Progress */}
        <div className="w-full max-w-lg mx-auto mb-4 sm:mb-8">
          <div className="flex items-center gap-1.5 mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-0.5">
            <p className="text-xs text-white/50 font-medium">{STEPS[step].subtitle}</p>
            <p className="text-xs text-white/40 font-medium tabular-nums">{step + 1} / {STEPS.length}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center pb-16 sm:pb-24">
          <div className="w-full lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            {/* Form column */}
            <div className="w-full max-w-lg mx-auto lg:col-span-5 lg:mx-0 lg:max-w-none">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Step 0 — Welcome */}
                {step === 0 && (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6"
                    >
                      <Rocket className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                      Welcome to Ayn
                    </h1>
                    <p className="text-white/60 text-base leading-relaxed max-w-md mx-auto mb-2">
                      Let&apos;s set up your workspace. We&apos;ll ask a few questions to tailor Ayn to your institution.
                    </p>
                    <p className="text-white/30 text-sm">
                      Takes about 2 minutes.
                    </p>
                  </div>
                )}

                {/* Step 1 — Institution name */}
                {step === 1 && (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-5">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Name your institution</h2>
                    <p className="text-white/50 text-sm mb-6">This will be your workspace name.</p>
                    <input
                      autoFocus
                      type="text"
                      value={instName}
                      onChange={e => setInstName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && canProceed && goNext()}
                      placeholder="e.g., Cairo University"
                      className="w-full max-w-sm mx-auto px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-base outline-none focus:border-primary/50 focus:bg-white/[0.12] transition-all placeholder:text-white/25"
                    />
                  </div>
                )}

                {/* Step 2 — Institution type */}
                {step === 2 && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What best describes you?</h2>
                      <p className="text-white/50 text-sm">Select your institution type.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                      {INSTITUTION_TYPES.map(t => {
                        const Icon = t.icon
                        const isSelected = instType === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { setInstType(t.id); setTimeout(goNext, 200) }}
                            className={cn(
                              "flex flex-col items-center gap-2.5 p-5 rounded-xl border transition-all duration-300 cursor-pointer",
                              isSelected
                                ? "bg-primary/15 border-primary/40 text-white"
                                : "bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/[0.1] hover:border-white/20 hover:text-white/80"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-semibold">{t.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3 — Departments */}
                {step === 3 && (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-5">
                      <Library className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How many departments?</h2>
                    <p className="text-white/50 text-sm mb-8">Approximate number of faculties or departments.</p>
                    <div className="max-w-xs mx-auto">
                      <motion.div
                        key={deptCount}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-bold text-primary mb-4"
                      >
                        {deptCount}
                      </motion.div>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={deptCount}
                        onChange={e => setDeptCount(Number(e.target.value))}
                        className="w-full h-1.5 rounded-lg bg-white/10 appearance-none cursor-pointer accent-primary focus:outline-none"
                      />
                      <div className="flex justify-between text-xs text-white/30 mt-1.5">
                        <span>1</span>
                        <span>15</span>
                        <span>30</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Standards */}
                {step === 4 && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Compliance standards</h2>
                      <p className="text-white/50 text-sm">Select the frameworks you work with.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                      {STANDARDS.map(s => {
                        const isSelected = selectedStandards.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStandard(s.id)}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer",
                              isSelected
                                ? "bg-primary/15 border-primary/40"
                                : "bg-white/[0.06] border-white/10 hover:bg-white/[0.1] hover:border-white/20"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              isSelected ? "bg-primary border-primary" : "border-white/30"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className={cn(
                                "text-sm font-semibold",
                                isSelected ? "text-white" : "text-white/70"
                              )}>{s.label}</p>
                              <p className={cn(
                                "text-xs",
                                isSelected ? "text-white/50" : "text-white/40"
                              )}>{s.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5 — Confirm */}
                {step === 5 && (
                  <div className="text-center">
                    {!isCompleted ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                          className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6"
                        >
                          <Sparkles className="w-7 h-7 text-primary" />
                        </motion.div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to launch</h2>
                        <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
                          We&apos;ll create your workspace with the settings below.
                        </p>

                        <div className="bg-white/[0.06] border border-white/10 rounded-xl p-5 text-left max-w-sm mx-auto mb-8 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Institution</span>
                            <span className="text-white text-sm font-semibold">{instName}</span>
                          </div>
                          <div className="h-px bg-white/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Type</span>
                            <span className="text-white text-sm capitalize">{instType}</span>
                          </div>
                          <div className="h-px bg-white/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Departments</span>
                            <span className="text-white text-sm">{deptCount}</span>
                          </div>
                          <div className="h-px bg-white/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Standards</span>
                            <span className="text-white text-sm">{selectedStandards.length}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCreate}
                          disabled={isCreating}
                          className={cn(
                            "inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all duration-300 cursor-pointer",
                            isCreating
                              ? "bg-primary/50 text-white/70 cursor-wait"
                              : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-[0_8px_24px_rgba(59,130,246,0.3)]"
                          )}
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating workspace...
                            </>
                          ) : (
                            <>
                              Create workspace
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                          <Check className="w-9 h-9 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">You&apos;re all set!</h2>
                        <p className="text-white/50 text-sm">Redirecting to your dashboard...</p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {step < 5 && (
              <div className="flex items-center justify-between mt-8">
                <div>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition-all duration-300 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!canProceed && step > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 1) setInstName(user?.name ? `${user.name}'s Institution` : "My Institution")
                        if (step === 2) setInstType("other")
                        goNext()
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed}
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                      canProceed
                        ? "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-[0_4px_16px_rgba(59,130,246,0.25)] cursor-pointer"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    {step === 4 ? "Review" : "Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Right side: Live Preview (Desktop only) */}
            <div className="hidden lg:block lg:col-span-7 h-full">
              <OnboardingPreview
                step={step}
                instName={instName}
                instType={instType}
                deptCount={deptCount}
                selectedStandards={selectedStandards}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

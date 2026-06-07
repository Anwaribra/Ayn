"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Shield, Brain, List, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { usePageTitle } from "@/hooks/use-page-title"
import { useUiLanguage } from "@/lib/ui-language-context"
import { GlassCard } from "@/components/ui/glass-card"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HorusOperationsPage() {
  return (
    <ProtectedRoute>
      <HorusOperationsContent />
    </ProtectedRoute>
  )
}

function HorusOperationsContent() {
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "عمليات حورس" : "Horus Operations")
  const { user } = useAuth()
  const campusId = user?.institutionId || "00000000-0000-0000-0000-000000000000"

  const [activeTab, setActiveTab] = useState<"dashboard" | "audit" | "mock_audit">("dashboard")
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [auditResult, setAuditResult] = useState<any>(null)
  const [isAuditing, setIsAuditing] = useState(false)

  const { data: latestBriefing } = useSWR(`/api/v2/horus/briefings/latest?campus_id=${campusId}`, fetcher)
  const { data: actionLogs } = useSWR(`/api/v2/horus/action-logs?campus_id=${campusId}&limit=10`, fetcher)
  const { data: standards, error: standardsError, isLoading: standardsLoading } = useSWR(campusId ? `/api/v2/standards?campus_id=${campusId}` : null, fetcher)

  const activeStandardId = selectedStandardId || (standards && standards.length > 0 ? standards[0].id : "")

  const handleRunMockAudit = async (standardId: string) => {
    if (!standardId) {
      toast.error(isArabic ? "الرجاء اختيار معيار أولاً." : "Please select a standard first.")
      return
    }
    setIsAuditing(true)
    setAuditResult(null)
    toast.info(isArabic ? "جاري تشغيل محاكاة التدقيق..." : "Triggering Mock Audit Simulation...")
    try {
      const res = await fetch("/api/v2/horus/mock-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus_id: campusId, standard_id: standardId })
      })
      if (res.ok) {
        const data = await res.json()
        const auditId = data.audit_id
        
        const resStatus = await fetch(`/api/v2/horus/mock-audits/${auditId}`)
        if (resStatus.ok) {
          const auditData = await resStatus.json()
          setAuditResult(auditData)
          toast.success(isArabic ? "اكتملت محاكاة التدقيق بنجاح." : "Mock Audit Simulation completed successfully.")
        } else {
          toast.error(isArabic ? "فشل استرداد تفاصيل محاكاة التدقيق." : "Failed to retrieve audit simulation details.")
        }
      } else {
        toast.error(isArabic ? "فشل تشغيل محاكاة التدقيق." : "Failed to run mock audit.")
      }
    } catch (e) {
      toast.error(isArabic ? "فشل الاتصال بمحرك حورس." : "Error connecting to Horus engine.")
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className={cn("mx-auto platform-container-default p-6 md:p-10 space-y-8", isArabic && "font-arabic")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {isArabic ? "عمليات حورس (V2)" : "Horus Operations (V2)"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isArabic ? "محرك التنسيق والامتثال الذاتي" : "Autonomous Compliance Orchestration Engine"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--glass-border)] pb-px">
        {[
          { id: "dashboard", labelEn: "Dashboard & Briefings", labelAr: "لوحة القيادة", icon: Brain },
          { id: "audit", labelEn: "Action Audit Log", labelAr: "سجل التدقيق", icon: List },
          { id: "mock_audit", labelEn: "Mock Auditor", labelAr: "محاكاة التدقيق", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-[var(--glass-border)]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {isArabic ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <GlassCard className="p-6 border-primary/20 bg-primary/5">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Cpu className="text-primary w-5 h-5" />
                  {isArabic ? "الملخص اليومي التنفيذي" : "Daily Executive Briefing"}
                </h3>
                {latestBriefing ? (
                  <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{latestBriefing.summary_content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{isArabic ? "جاري تحميل الملخص..." : "Loading briefing..."}</p>
                )}
              </GlassCard>
            </div>
          )}

          {activeTab === "audit" && (
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{isArabic ? "الحدث المسبب" : "Event"}</th>
                    <th className="px-4 py-3">{isArabic ? "الإجراء المنفذ" : "Action"}</th>
                    <th className="px-4 py-3">{isArabic ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-3">{isArabic ? "مستوى الثقة" : "Confidence"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {actionLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{log.triggering_event}</td>
                      <td className="px-4 py-3 font-medium text-primary">{log.executed_action}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs uppercase font-bold">
                          {log.execution_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{(log.confidence_score * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                  {!actionLogs && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        {isArabic ? "جاري التحميل..." : "Loading..."}
                      </td>
                    </tr>
                  )}
                  {actionLogs?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        {isArabic ? "لا توجد إجراءات مسجلة بعد." : "No autonomous actions recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </GlassCard>
          )}

          {activeTab === "mock_audit" && (
            <div className="flex flex-col items-center justify-center py-10 text-center max-w-2xl mx-auto space-y-6">
              <Shield className="w-16 h-16 text-muted-foreground/30" />
              <h3 className="text-2xl font-bold">
                {isArabic ? "محاكاة تدقيق الاعتماد الاكاديمي" : "Simulate Accreditation Audit"}
              </h3>
              <p className="text-muted-foreground max-w-lg">
                {isArabic 
                  ? "اختر المعيار الاكاديمي المطلوب. سيقوم حورس بتحليل توافق الأدلة الحالية لتوقع نسبة القبول وحصر البنود غير المكتملة." 
                  : "Select a standard below. Horus will deterministically analyze all evidence mappings to project your final auditor score and identify failed criteria."
                }
              </p>
              
              {standardsLoading ? (
                <p className="text-sm text-muted-foreground">{isArabic ? "جاري تحميل المعايير..." : "Loading standards..."}</p>
              ) : standardsError ? (
                <p className="text-sm text-red-500">{isArabic ? "فشل في تحميل المعايير." : "Failed to load standards."}</p>
              ) : standards && standards.length > 0 ? (
                <div className="w-full max-w-xs space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block text-left">
                    {isArabic ? "اختر المعيار" : "Select Standard"}
                  </label>
                  <select 
                    value={activeStandardId}
                    onChange={(e) => setSelectedStandardId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md text-foreground focus:outline-none focus:border-primary text-sm"
                  >
                    {standards.map((std: any) => (
                      <option key={std.id} value={std.id} className="bg-black text-white">
                        {std.code ? `[${std.code}] ` : ""}{std.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-amber-500">{isArabic ? "لم يتم العثور على معايير لهذا الفرع." : "No standards found for this campus."}</p>
              )}

              <button
                onClick={() => handleRunMockAudit(activeStandardId)}
                disabled={isAuditing || !activeStandardId}
                className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isAuditing 
                  ? (isArabic ? "جاري المحاكاة..." : "Simulating...") 
                  : (isArabic ? "تشغيل محاكاة التدقيق" : "Run Mock Audit")
                }
              </button>

              {auditResult && (
                <GlassCard className="w-full text-left p-6 space-y-6 mt-8 border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{isArabic ? "نتائج محاكاة الامتثال" : "Simulation Results"}</h4>
                      <p className="text-xs text-muted-foreground">{isArabic ? "اكتملت بنجاح" : "Completed successfully"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-primary">
                        {(auditResult.report_payload.overall_score * 100).toFixed(1)}%
                      </span>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {isArabic ? "مؤشر الامتثال المتوقع" : "Projected Score"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-[var(--glass-border)] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500" 
                      style={{ width: `${auditResult.report_payload.overall_score * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                      <span className="text-2xl font-bold text-red-500">
                        {auditResult.report_payload.failed_criteria_count}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{isArabic ? "المعايير الفرعية غير المطابقة" : "Failed Criteria"}</p>
                    </div>
                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                      <span className="text-2xl font-bold text-amber-500">
                        {auditResult.report_payload.findings.length}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{isArabic ? "إجمالي الثغرات المكتشفة" : "Total Gaps Found"}</p>
                    </div>
                  </div>

                  {auditResult.report_payload.findings.length > 0 ? (
                    <div className="space-y-3">
                      <h5 className="font-bold text-sm text-muted-foreground">{isArabic ? "تفاصيل الثغرات المرصودة" : "Detailed Findings"}</h5>
                      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2">
                        {auditResult.report_payload.findings.map((f: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-start justify-between gap-4 text-xs"
                          >
                            <div className="space-y-1">
                              <span className="font-semibold text-foreground/90 block">{f.criterion}</span>
                              <p className="text-muted-foreground leading-normal">{f.issue}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs uppercase font-bold shrink-0",
                              f.severity === "CRITICAL" && "bg-red-500/10 text-red-500",
                              f.severity === "HIGH" && "bg-orange-500/10 text-orange-500",
                              f.severity === "MEDIUM" && "bg-yellow-500/10 text-yellow-500",
                              f.severity === "LOW" && "bg-blue-500/10 text-blue-500"
                            )}>
                              {f.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-500 font-medium">
                      {isArabic ? "جميع البنود مكتملة ومطابقة تماماً!" : "All criteria are fully satisfied! No gaps found."}
                    </p>
                  )}
                </GlassCard>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useUiLanguage } from "@/lib/ui-language-context"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  Shield,
  Check,
  X,
  Clock,
  Mail,
  Building2,
  User,
  Filter,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AccessRequest = {
  id: string
  userId: string | null
  name: string
  email: string
  institution: string
  role: string
  type: string
  message: string | null
  status: string
  reviewedBy: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/platform/dashboard")
    }
  }, [user, router])

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getAccessRequests({ status: filter, take: 100 })
      setRequests(data.requests)
      setTotal(data.total)
    } catch {
      toast.error(isArabic ? "فشل في تحميل طلبات الوصول" : "Failed to load access requests")
    } finally {
      setIsLoading(false)
    }
  }, [filter, isArabic])

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchRequests()
    }
  }, [user, fetchRequests])

  const handleReview = async (requestId: string, action: "approve" | "reject") => {
    setActionInProgress(requestId)
    try {
      await api.reviewAccessRequest(requestId, {
        action,
        note: reviewNote || undefined,
      })
      toast.success(
        isArabic
          ? `تم ${action === "approve" ? "قبول" : "رفض"} الطلب بنجاح`
          : `Request ${action === "approve" ? "approved" : "rejected"} successfully`
      )
      setReviewingId(null)
      setReviewNote("")
      fetchRequests()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isArabic
            ? `فشل ${action === "approve" ? "قبول" : "رفض"} الطلب`
            : `Failed to ${action} request`
      )
    } finally {
      setActionInProgress(null)
    }
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex h-full min-h-[calc(100dvh-64px)] items-center justify-center" dir={isArabic ? "rtl" : "ltr"}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={cn("mx-auto platform-container-wide space-y-6 p-4 md:p-8", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(59,111,217,0.12),rgba(59,111,217,0.04))]">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isArabic ? "لوحة الإدارة" : "Admin Panel"}</h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? `إدارة طلبات الوصول إلى حورس AI (${total} إجمالي)` : `Manage Horus AI access requests (${total} total)`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchRequests} className="rounded-xl">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className={cn("h-4 w-4 text-muted-foreground", isArabic && "rotate-180")} />
        {[
          { label: "All", value: undefined },
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isArabic
              ? (f.value === undefined ? "الكل" : f.value === "PENDING" ? "قيد الانتظار" : f.value === "APPROVED" ? "موافق عليه" : "مرفوض")
              : f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <GlassCard className="border-border p-12 text-center">
          <p className="text-muted-foreground">{isArabic ? "لم يتم العثور على طلبات وصول" : "No access requests found"}</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {requests.map((req, idx) => {
              const isExpanded = reviewingId === req.id
              const statusColor = req.status === "PENDING" ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                : req.status === "APPROVED" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                : "text-red-400 bg-red-400/10 border-red-400/20"
              const StatusIcon = req.status === "PENDING" ? Clock : req.status === "APPROVED" ? Check : X

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <GlassCard className="border-border overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold">{req.name}</h3>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{req.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1">
                              <Building2 className="h-3 w-3" />
                              {req.institution}
                            </span>
                            <span className="rounded-lg bg-muted/50 px-2 py-1 capitalize">{req.role}</span>
                            <span className="rounded-lg bg-primary/10 px-2 py-1 font-medium text-primary capitalize">{req.type}</span>
                            <span className="text-muted-foreground">
                              {new Date(req.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                                month: "short", day: "numeric", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {req.message && (
                            <p className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium", statusColor)}>
                            <StatusIcon className="h-3 w-3" />
                            {isArabic
                              ? (req.status === "PENDING" ? "قيد الانتظار" : req.status === "APPROVED" ? "موافق عليه" : "مرفوض")
                              : req.status === "PENDING" ? "Pending" : req.status === "APPROVED" ? "Approved" : "Rejected"}
                          </span>

                          {req.status === "PENDING" && (
                            <div className="flex items-center gap-1.5">
                              <Button size="sm" onClick={() => isExpanded ? setReviewingId(null) : setReviewingId(req.id)} variant="ghost" className="h-8 gap-1 rounded-xl text-xs">
                                <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                                {isArabic ? "مراجعة" : "Review"}
                              </Button>
                              <Button size="sm" onClick={() => handleReview(req.id, "approve")} disabled={actionInProgress === req.id} className="h-8 gap-1 rounded-xl bg-emerald-600 text-xs hover:bg-emerald-700">
                                <Check className="h-3 w-3" />
                                {isArabic ? "قبول" : "Approve"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReview(req.id, "reject")} disabled={actionInProgress === req.id} className="h-8 gap-1 rounded-xl text-xs">
                                <X className="h-3 w-3" />
                                {isArabic ? "رفض" : "Reject"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-4 border-t border-border pt-4">
                              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                {isArabic ? "ملاحظة المشرف (اختياري)" : "Admin Note (optional)"}
                              </label>
                              <textarea
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder={isArabic ? "أضف ملاحظة للمستخدم..." : "Add a note for the user..."}
                                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={2}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {req.reviewNote && req.status !== "PENDING" && (
                        <div className="mt-3 rounded-xl bg-muted/30 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            <strong>{isArabic ? "ملاحظة المشرف:" : "Admin note:"}</strong> {req.reviewNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

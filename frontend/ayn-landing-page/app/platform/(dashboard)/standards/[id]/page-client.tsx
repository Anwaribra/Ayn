"use client"

import { Header } from "@/components/platform/header"
import { DetailPageSkeleton } from "@/components/platform/detail-page-skeleton"
import { CoverageBar } from "@/components/platform/coverage-bar"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Plus,
  CheckCircle2,
  GraduationCap,
  Globe,
  Layers3,
  ArrowUpRight,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassPanel } from "@/components/ui/glass-panel"
import Link from "next/link"
import type { Criterion } from "@/types/standards"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"
import { getStandardDisplayTitle } from "@/lib/standard-display"
import { resolveStandardColorClass } from "@/lib/standard-color"

function formatValue(value?: string | null, fallback = "Unspecified") {
  return value?.trim() || fallback
}

export function StandardDetailPageClient() {
  const { id } = useParams()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const standardId = id as string

  const { data: standard, isLoading: loadingStandard } = useSWR(
    standardId ? `standard-${standardId}` : null,
    () => api.getStandard(standardId),
  )
  const { data: criteria, isLoading: loadingCriteria } = useSWR(
    standardId ? `criteria-${standardId}` : null,
    () => api.getCriteria(standardId),
  )
  const { data: coverage, isLoading: loadingCoverage } = useSWR(
    standardId ? `coverage-${standardId}` : null,
    () => api.getStandardCoverage(standardId),
  )

  const isLoading = loadingStandard || loadingCriteria || loadingCoverage

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title={isArabic ? "جاري تحميل المعيار…" : "Loading standard..."}
        statBlocks={4}
        showSecondaryBlock
      />
    )
  }

  if (!standard) {
    return (
      <div className="min-h-screen">
        <Header title={isArabic ? "المعيار غير موجود" : "Standard Not Found"} />
        <div className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            {isArabic ? "لا يوجد معيار بهذا المسار." : "The standard you're looking for doesn't exist."}
          </p>
          <Link href="/platform/standards">
            <Button>{isArabic ? "العودة إلى المعايير" : "Back to Standards"}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const displayTitle = getStandardDisplayTitle(standard, isArabic)

  const criteriaCount = criteria?.length ?? standard.criteriaCount ?? 0
  const coveredCriteria = coverage?.coveredCriteria ?? 0
  const totalCriteria = coverage?.totalCriteria ?? criteriaCount
  const coveragePct = Math.round(coverage?.coveragePct ?? 0)
  const readinessTone = isArabic
    ? coveragePct >= 80
      ? "قوي"
      : coveragePct >= 40
        ? "جزئي"
        : totalCriteria === 0
          ? "غير مربوط"
          : "حرج"
    : coveragePct >= 80
      ? "Strong"
      : coveragePct >= 40
        ? "Partial"
        : totalCriteria === 0
          ? "Unmapped"
          : "Critical"
  const readinessClass =
    coveragePct >= 80
      ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]"
      : coveragePct >= 40
        ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
        : totalCriteria === 0
          ? "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] text-muted-foreground"
          : "border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] text-[var(--status-critical)]"

  return (
    <div className={cn("min-h-screen", isArabic && "font-arabic")}>
      <Header
        title={displayTitle}
        description={
          standard.description ||
          (isArabic
            ? "تفاصيل الإطار، هيكل المعايير، وتغطية الجاهزية."
            : "Framework detail, criteria structure, and readiness coverage.")
        }
        breadcrumbs={[
          { label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
          { label: isArabic ? "المعايير" : "Standards", href: "/platform/standards" },
          { label: displayTitle },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/platform/standards/${standardId}/edit`}>
              <Button variant="outline" className="glass-button rounded-2xl border-[var(--glass-border)] text-foreground">
                <Edit className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")} />
                {isArabic ? "تعديل" : "Edit"}
              </Button>
            </Link>
            <Button
              className="rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_36px_-20px_rgba(37,99,235,0.45)]"
              onClick={() => router.push(`/platform/gap-analysis?standardId=${standardId}`)}
            >
              <ArrowUpRight className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")} />
              {isArabic ? "تشغيل التحليل" : "Run Analysis"}
            </Button>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-3 md:px-6 xl:px-8">
        <Link
          href="/platform/standards"
          className={cn(
            "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
            isArabic && "flex-row-reverse",
          )}
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {isArabic ? "العودة إلى المعايير" : "Back to standards"}
        </Link>

        <section className="glass-card relative overflow-hidden rounded-[32px] p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_70%)] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.45),transparent)]" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br text-white shadow-xl",
                    resolveStandardColorClass(standard.color),
                  )}
                >
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      {standard.code || "STD-LIB"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                        readinessClass,
                      )}
                    >
                      {readinessTone}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {displayTitle}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {standard.description ||
                        (isArabic ? "لا يوجد وصف لهذا الإطار بعد." : "No description available for this framework yet.")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {isArabic ? "المعايير الفرعية" : "Criteria"}
                  </p>
                  <p className="mt-2 text-2xl font-black text-foreground">{criteriaCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {isArabic ? "مغطاة" : "Covered"}
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--status-success)]">{coveredCriteria}</p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {isArabic ? "التغطية" : "Coverage"}
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary">{coveragePct}%</p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {isArabic ? "وقت الإعداد التقريبي" : "Estimated Setup"}
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground">
                    {standard.estimatedSetup || (isArabic ? "غير متاح" : "N/A")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,var(--glass-soft-bg),color-mix(in_srgb,var(--glass-soft-bg)_72%,transparent))] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {isArabic ? "بيانات الإطار" : "Framework Metadata"}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <Layers3 className="h-3.5 w-3.5" />
                      {isArabic ? "الفئة" : "Category"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatValue(standard.category)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      {isArabic ? "المنطقة" : "Region"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatValue(standard.region, "Global")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <FileCheck className="h-3.5 w-3.5" />
                      {isArabic ? "المصدر" : "Source"}
                    </span>
                    <span className="text-sm font-semibold capitalize text-foreground">
                      {formatValue(standard.source, "Manual")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,var(--glass-soft-bg),color-mix(in_srgb,var(--glass-soft-bg)_72%,transparent))] p-5">
                <CoverageBar
                  standardId={standardId}
                  result={{
                    standardId,
                    totalCriteria,
                    coveredCriteria,
                    coveragePct,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[28px] border-[var(--glass-border)] p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {isArabic ? "هيكل المعايير الفرعية" : "Criteria Architecture"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isArabic
                  ? "راجع البنود وأضف المعايير الناقصة عند الحاجة."
                  : "Review the underlying clauses and add missing criteria where needed."}
              </p>
            </div>
            <Link href={`/platform/standards/${standardId}/criteria/new`}>
              <Button className="rounded-2xl bg-primary text-primary-foreground">
                <Plus className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")} />
                {isArabic ? "إضافة معيار فرعي" : "Add Criterion"}
              </Button>
            </Link>
          </div>

          {!criteria || criteria.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--glass-border)] py-16 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {isArabic ? "لا توجد معايير فرعية بعد" : "No criteria defined yet"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {criteria.map((criterion: Criterion, index: number) => (
                <div
                  key={criterion.id}
                  className="rounded-[24px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-4 transition-colors hover:border-[var(--glass-border)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] text-sm font-bold text-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{criterion.title}</h4>
                      {criterion.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

"use client"

import { Header } from "@/components/platform/header"
import { DetailPageSkeleton } from "@/components/platform/detail-page-skeleton"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { ClipboardList, ArrowLeft, Edit, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StatusBadge } from "@/components/platform/status-badge"
import { useState } from "react"

export function AssessmentDetailPageClient() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: assessment,
    isLoading,
    mutate,
  } = useSWR(id ? `assessment-${id}` : null, () => api.getAssessment(id as string))

  const canEdit = assessment?.status === "DRAFT" && (user?.role === "TEACHER" || user?.role === "ADMIN")
  const canSubmit = assessment?.status === "DRAFT" && (user?.role === "TEACHER" || user?.role === "ADMIN")
  const canReview = assessment?.status === "SUBMITTED" && (user?.role === "AUDITOR" || user?.role === "ADMIN")

  const handleSubmit = async () => {
    if (!assessment) return
    setIsSubmitting(true)
    try {
      await api.submitAssessment(assessment.id)
      mutate()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <DetailPageSkeleton title="Loading assessment..." statBlocks={2} showSecondaryBlock />
  }

  if (!assessment) {
    return (
      <div className="min-h-screen">
        <Header title="Assessment Not Found" />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">The assessment you're looking for doesn't exist.</p>
          <Link href="/platform/assessments">
            <Button>Back to Assessments</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Assessment #${assessment.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Assessments", href: "/platform/assessments" },
          { label: `#${assessment.id.slice(0, 8)}` },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
        <Link
          href="/platform/assessments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to assessments
        </Link>

        {/* Assessment Info Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <ClipboardList className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">Assessment #{assessment.id.slice(0, 8)}</h2>
                  <StatusBadge status={assessment.status} />
                </div>
                <p className="text-muted-foreground">Created {new Date(assessment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Link href={`/platform/assessments/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              {canSubmit && (
                <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              )}
              {canReview && (
                <Link href={`/platform/assessments/${id}/review`}>
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <StatusBadge status={assessment.status} size="sm" />
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Answers</p>
              <p className="text-lg font-semibold text-foreground">{assessment.answers?.length ?? 0}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Submitted</p>
              <p className="text-lg font-semibold text-foreground">
                {assessment.submittedAt ? new Date(assessment.submittedAt).toLocaleDateString() : "Not yet"}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
              <p className="text-lg font-semibold text-foreground">
                {assessment.reviewedAt ? new Date(assessment.reviewedAt).toLocaleDateString() : "Not yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Reviewer Comment */}
        {assessment.reviewerComment && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Reviewer Comment</h3>
            <p className="text-foreground">{assessment.reviewerComment}</p>
          </div>
        )}

        {/* Answers List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Answers ({assessment.answers?.length ?? 0})</h3>

          {!assessment.answers || assessment.answers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No answers yet</p>
              {canEdit && (
                <Link href={`/platform/assessments/${id}/edit`}>
                  <Button className="mt-4">
                    <Edit className="w-4 h-4 mr-2" />
                    Start Editing
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {assessment.answers.map((answer, index) => (
                <div key={answer.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium text-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-2">
                        {answer.criterion?.title || `Criterion ${answer.criterionId.slice(0, 8)}`}
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{answer.answer}</p>
                      {answer.reviewerComment && (
                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-green-400">
                            <span className="font-medium">Reviewer:</span> {answer.reviewerComment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}











"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"

export function ReviewAssessmentPageClient() {
  const { id } = useParams()
  const router = useRouter()
  const [reviewerComment, setReviewerComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: assessment, isLoading } = useSWR(id ? `assessment-${id}` : null, () => api.getAssessment(id as string))

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.reviewAssessment(id as string, reviewerComment)
      router.push(`/platform/assessments/${id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!assessment || assessment.status !== "SUBMITTED") {
    return (
      <div className="min-h-screen">
        <Header title="Cannot Review" />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">This assessment cannot be reviewed.</p>
          <Link href="/platform/assessments">
            <Button>Back to Assessments</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]}>
      <div className="min-h-screen">
        <Header
          title={`Review Assessment #${assessment.id.slice(0, 8)}`}
          description="Review and provide feedback on this assessment"
        />

        <div className="p-4 md:p-8 space-y-6">
          <Link
            href={`/platform/assessments/${id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to assessment
          </Link>

          {/* Answers for Review */}
          <div className="space-y-4">
            {assessment.answers?.map((answer, index) => (
              <div key={answer.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium text-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-2">
                      {answer.criterion?.title || `Criterion ${answer.criterionId.slice(0, 8)}`}
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                      {answer.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Review Form */}
          <form
            onSubmit={handleSubmitReview}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
          >
            <Label className="text-lg font-semibold text-foreground mb-4 block">Overall Review Comment</Label>
            <Textarea
              value={reviewerComment}
              onChange={(e) => setReviewerComment(e.target.value)}
              placeholder="Provide your review feedback..."
              rows={6}
              className="bg-background/50 mb-4"
              required
            />
            <Button type="submit" disabled={isSubmitting || !reviewerComment}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Review...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}











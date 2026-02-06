"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { Criterion } from "@/lib/types"

export function EditAssessmentPageClient() {
  const { id } = useParams()
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState<string | null>(null)

  const { data: assessment, isLoading: loadingAssessment } = useSWR(id ? `assessment-${id}` : null, () =>
    api.getAssessment(id as string),
  )

  // We need to get criteria - assuming we have standard info in assessment
  const { data: criteria, isLoading: loadingCriteria } = useSWR(
    assessment ? `criteria-for-assessment` : null,
    async () => {
      // For now, return empty - in real app, we'd get standardId from assessment
      return [] as Criterion[]
    },
  )

  useEffect(() => {
    if (assessment?.answers) {
      const existingAnswers: Record<string, string> = {}
      assessment.answers.forEach((a) => {
        existingAnswers[a.criterionId] = a.answer
      })
      setAnswers(existingAnswers)
    }
  }, [assessment])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const answersArray = Object.entries(answers).map(([criterionId, answer]) => ({
        criterionId,
        answer,
      }))
      await api.saveAssessmentAnswers(id as string, answersArray)
      router.push(`/platform/assessments/${id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateAI = async (criterionId: string, criterionTitle: string) => {
    setGeneratingAI(criterionId)
    try {
      const response = await api.generateAnswer(`Generate a comprehensive answer for the criterion: ${criterionTitle}`)
      setAnswers((prev) => ({ ...prev, [criterionId]: response.result }))
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingAI(null)
    }
  }

  const isLoading = loadingAssessment || loadingCriteria

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

  if (!assessment || assessment.status !== "DRAFT") {
    return (
      <div className="min-h-screen">
        <Header title="Cannot Edit" />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">This assessment cannot be edited.</p>
          <Link href="/platform/assessments">
            <Button>Back to Assessments</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Use existing answers as criteria if no criteria fetched
  const displayCriteria =
    criteria && criteria.length > 0
      ? criteria
      : assessment.answers?.map((a) => ({
          id: a.criterionId,
          standardId: "",
          title: a.criterion?.title || `Criterion ${a.criterionId.slice(0, 8)}`,
          description: a.criterion?.description || null,
        })) || []

  return (
    <div className="min-h-screen">
      <Header
        title={`Edit Assessment #${assessment.id.slice(0, 8)}`}
        description="Fill in the assessment answers"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Assessments", href: "/platform/assessments" },
          { label: `#${assessment.id.slice(0, 8)}`, href: `/platform/assessments/${id}` },
          { label: "Edit" },
        ]}
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/platform/assessments/${id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to assessment
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Answers
              </>
            )}
          </Button>
        </div>

        {displayCriteria.length === 0 ? (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No criteria found for this assessment's standard.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayCriteria.map((criterion, index) => (
              <div key={criterion.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium text-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <Label className="text-lg font-medium text-foreground">{criterion.title}</Label>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAI(criterion.id, criterion.title)}
                    disabled={generatingAI === criterion.id}
                  >
                    {generatingAI === criterion.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={answers[criterion.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [criterion.id]: e.target.value }))}
                  placeholder="Enter your answer..."
                  rows={6}
                  className="bg-background/50"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Answers
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}











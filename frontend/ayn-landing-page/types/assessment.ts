// Assessment types

import type { Criterion } from "./standards"
import type { Institution, User } from "./user"

export type AssessmentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED"

export interface Assessment {
  id: string
  institutionId: string
  userId: string
  status: AssessmentStatus
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewerComment: string | null
  answers: AssessmentAnswer[]
  standardId?: string | null
  institution?: Institution
  user?: User
}

export interface AssessmentAnswer {
  id: string
  assessmentId: string
  criterionId: string
  answer: string
  reviewerComment: string | null
  criterion?: Criterion
}

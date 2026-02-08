// Evidence types

import type { Criterion } from "./standards"

export interface Evidence {
  id: string
  criterionId: string | null
  fileUrl: string
  fileName?: string
  fileType?: string
  uploadedById: string
  createdAt: string
  updatedAt: string
  criterion?: Criterion
}

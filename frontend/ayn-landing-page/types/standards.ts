// Standards & Criteria types

export interface Standard {
  id: string
  title: string
  description: string | null
}

export interface Criterion {
  id: string
  standardId: string
  title: string
  description: string | null
}

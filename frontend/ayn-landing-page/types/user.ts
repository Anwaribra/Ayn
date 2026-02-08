// User & Institution types

export interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "TEACHER" | "AUDITOR"
  institutionId: string | null
  createdAt: string
}

export interface Institution {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userCount?: number
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

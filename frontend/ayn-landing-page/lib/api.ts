// API client for Horus Engine Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        window.location.href = "/platform/login"
      }
      const error = await response.json().catch(() => ({ detail: "An error occurred" }))
      throw new Error(error.detail || "An error occurred")
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{
      user: import("./types").User
      access_token: string
      token_type: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem("access_token", response.access_token)
    localStorage.setItem("user", JSON.stringify(response.user))
    return response
  }

  async loginWithGoogle(idToken: string) {
    const response = await this.request<{
      user: import("./types").User
      access_token: string
      token_type: string
    }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    })
    localStorage.setItem("access_token", response.access_token)
    localStorage.setItem("user", JSON.stringify(response.user))
    return response
  }

  async register(data: {
    name: string
    email: string
    password: string
    role: import("./types").UserRole
    institutionId?: string | null
  }) {
    const response = await this.request<{
      user: import("./types").User
      access_token: string
      token_type: string
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
    localStorage.setItem("access_token", response.access_token)
    localStorage.setItem("user", JSON.stringify(response.user))
    return response
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" }).catch(() => {})
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
  }

  async getCurrentUser() {
    return this.request<import("./types").User>("/auth/me")
  }

  // Dashboard
  async getDashboardMetrics() {
    return this.request<import("./types").DashboardMetrics>("/dashboard/metrics")
  }

  // Institutions
  async getInstitutions() {
    return this.request<import("./types").Institution[]>("/institutions")
  }

  async getInstitution(id: string) {
    return this.request<import("./types").Institution>(`/institutions/${id}`)
  }

  async createInstitution(data: { name: string; description?: string }) {
    return this.request<import("./types").Institution>("/institutions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateInstitution(id: string, data: { name?: string; description?: string }) {
    return this.request<import("./types").Institution>(`/institutions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async assignUserToInstitution(institutionId: string, userId: string) {
    return this.request(`/institutions/${institutionId}/users`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async linkStandardToInstitution(institutionId: string, standardId: string) {
    return this.request(`/institutions/${institutionId}/standards`, {
      method: "POST",
      body: JSON.stringify({ standardId }),
    })
  }

  // Standards
  async getStandards() {
    return this.request<import("./types").Standard[]>("/standards")
  }

  async getStandard(id: string) {
    return this.request<import("./types").Standard>(`/standards/${id}`)
  }

  async createStandard(data: { title: string; description?: string }) {
    return this.request<import("./types").Standard>("/standards", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateStandard(id: string, data: { title?: string; description?: string }) {
    return this.request<import("./types").Standard>(`/standards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Criteria
  async getCriteria(standardId: string) {
    return this.request<import("./types").Criterion[]>(`/standards/${standardId}/criteria`)
  }

  async createCriterion(standardId: string, data: { title: string; description?: string }) {
    return this.request<import("./types").Criterion>(`/standards/${standardId}/criteria`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCriterion(criterionId: string, data: { title?: string; description?: string }) {
    return this.request<import("./types").Criterion>(`/standards/criteria/${criterionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Assessments
  async getAssessments() {
    return this.request<import("./types").Assessment[]>("/assessments")
  }

  async getAssessment(id: string) {
    return this.request<import("./types").Assessment>(`/assessments/${id}`)
  }

  async createAssessment(data: { institutionId: string; standardId: string }) {
    return this.request<import("./types").Assessment>("/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async saveAssessmentAnswers(assessmentId: string, answers: { criterionId: string; answer: string }[]) {
    return this.request<import("./types").AssessmentAnswer[]>(`/assessments/${assessmentId}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
  }

  async submitAssessment(assessmentId: string) {
    return this.request<{ message: string; assessmentId: string; status: string }>(
      `/assessments/${assessmentId}/submit`,
      { method: "POST" },
    )
  }

  async reviewAssessment(assessmentId: string, reviewerComment: string) {
    return this.request<{ message: string; assessmentId: string; status: string }>(
      `/assessments/${assessmentId}/review`,
      {
        method: "POST",
        body: JSON.stringify({ reviewerComment }),
      },
    )
  }

  // Evidence
  async getEvidence() {
    return this.request<import("./types").Evidence[]>("/evidence")
  }

  async getEvidenceItem(id: string) {
    return this.request<import("./types").Evidence>(`/evidence/${id}`)
  }

  async uploadEvidence(file: File) {
    const token = this.getToken()
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/evidence/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }))
      throw new Error(error.detail || "Upload failed")
    }

    return response.json()
  }

  async attachEvidence(evidenceId: string, criterionId: string) {
    return this.request(`/evidence/${evidenceId}/attach`, {
      method: "POST",
      body: JSON.stringify({ criterionId }),
    })
  }

  async deleteEvidence(id: string) {
    return this.request(`/evidence/${id}`, { method: "DELETE" })
  }

  // Notifications
  async getNotifications() {
    return this.request<import("./types").Notification[]>("/notifications")
  }

  async getUnreadNotifications() {
    return this.request<import("./types").Notification[]>("/notifications/unread")
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}`, { method: "PUT" })
  }

  async createNotification(data: { userId: string; title: string; body: string }) {
    return this.request("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // AI
  async generateAnswer(prompt: string, context?: string) {
    return this.request<import("./types").AIResponse>("/ai/generate-answer", {
      method: "POST",
      body: JSON.stringify({ prompt, context }),
    })
  }

  async summarize(content: string, maxLength?: number) {
    return this.request<import("./types").AIResponse>("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ content, maxLength }),
    })
  }

  async generateComment(text: string, focus?: string) {
    return this.request<import("./types").AIResponse>("/ai/comment", {
      method: "POST",
      body: JSON.stringify({ text, focus }),
    })
  }

  async explain(topic: string, level?: "basic" | "intermediate" | "advanced") {
    return this.request<import("./types").AIResponse>("/ai/explain", {
      method: "POST",
      body: JSON.stringify({ topic, level }),
    })
  }

  async extractEvidence(text: string, criteria?: string) {
    return this.request<import("./types").AIResponse>("/ai/evidence/extract", {
      method: "POST",
      body: JSON.stringify({ text, criteria }),
    })
  }

  // Admin - Users
  async getUsers() {
    return this.request<import("./types").User[]>("/admin/users")
  }

  async updateUserRole(userId: string, role: import("./types").UserRole) {
    return this.request(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    })
  }
}

export const api = new ApiClient()

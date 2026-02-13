// API client for Horus Engine Platform

import { log } from "./logger"

// Use relative /api path so requests go through Next.js rewrites (same-origin, no CORS).
// The rewrite in next.config.mjs proxies /api/* to the Railway backend.
const API_BASE_URL = "/api"

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
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`
    log(`[API Request] ${options.method || "GET"} ${fullUrl}`)

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    if (!response.ok) {
      log(`[API Error] ${response.status} ${response.statusText} for ${fullUrl}`)
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:unauthorized"))
          window.location.assign("/login")
        }
      }
      // Try to parse error body, show status code for debugging
      const errorBody = await response.text().catch(() => "")
      let detail = `Error ${response.status}`
      try {
        const parsed = JSON.parse(errorBody)
        detail = parsed.detail || parsed.message || parsed.error || detail
      } catch {
        if (errorBody) detail = errorBody.slice(0, 200)
      }
      log(`[API Error Detail] ${detail}`)
      throw new Error(detail)
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

  async syncWithSupabase(supabaseToken: string) {
    log("[API] Syncing with Supabase...")
    const response = await this.request<{
      user: import("./types").User
      access_token: string
      token_type: string
    }>("/auth/supabase-sync", {
      method: "POST",
      body: JSON.stringify({ access_token: supabaseToken }),
    })
    log("[API] Supabase sync successful, storing tokens...")
    localStorage.setItem("access_token", response.access_token)
    localStorage.setItem("user", JSON.stringify(response.user))
    log("[API] User logged in:", response.user.email)
    return response
  }

  async register(data: {
    name: string
    email: string
    password: string
    role?: string | null
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
    await this.request("/auth/logout", { method: "POST" }).catch(() => { })
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
  }

  async getCurrentUser() {
    return this.request<import("./types").User>("/auth/me")
  }

  async updateUser(data: { name?: string }) {
    return this.request<import("./types").User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM STATE APIs (Modules WRITE)
  // ═══════════════════════════════════════════════════════════════════════════

  async recordFileUpload(fileId: string, name: string, type: string, size: number) {
    return this.request("/state/files", {
      method: "POST",
      body: JSON.stringify({ fileId, name, file_type: type, size }),
    })
  }

  async recordFileAnalysis(fileId: string, standards: string[], documentType?: string, clauses?: string[], confidence?: number) {
    return this.request(`/state/files/${fileId}/analyze`, {
      method: "POST",
      body: JSON.stringify({ standards, document_type: documentType, clauses, confidence }),
    })
  }

  async recordEvidenceCreated(evidenceId: string, title: string, type: string, criteriaRefs?: string[]) {
    return this.request("/state/evidence", {
      method: "POST",
      body: JSON.stringify({ evidence_id: evidenceId, title, ev_type: type, criteria_refs: criteriaRefs }),
    })
  }

  async recordEvidenceLinked(evidenceId: string, fileIds: string[]) {
    return this.request(`/state/evidence/${evidenceId}/link`, {
      method: "POST",
      body: JSON.stringify({ file_ids: fileIds }),
    })
  }

  async recordGapDefined(gapId: string, standard: string, clause: string, description: string, severity?: string) {
    return this.request("/state/gaps", {
      method: "POST",
      body: JSON.stringify({ gap_id: gapId, standard, clause, description, severity }),
    })
  }

  async recordGapAddressed(gapId: string, evidenceId: string) {
    return this.request(`/state/gaps/${gapId}/address`, {
      method: "POST",
      body: JSON.stringify({ evidence_id: evidenceId }),
    })
  }

  async recordGapClosed(gapId: string) {
    return this.request(`/state/gaps/${gapId}/close`, {
      method: "POST",
    })
  }

  async recordMetricUpdate(metricId: string, name: string, value: number, sourceModule: string) {
    return this.request("/state/metrics", {
      method: "POST",
      body: JSON.stringify({ metric_id: metricId, name, value, source_module: sourceModule }),
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE READ APIs (Horus READS)
  // ═══════════════════════════════════════════════════════════════════════════

  async getStateSummary() {
    return this.request<import("./types").StateSummary>("/state/summary")
  }

  async getStateFiles() {
    return this.request<import("./types").PlatformFile[]>("/state/files")
  }

  async getStateEvidence() {
    return this.request<import("./types").PlatformEvidence[]>("/state/evidence")
  }

  async getStateGaps() {
    return this.request<import("./types").PlatformGap[]>("/state/gaps")
  }

  async getStateMetrics() {
    return this.request<import("./types").PlatformMetric[]>("/state/metrics")
  }

  async getStateEvents(limit?: number) {
    return this.request<import("./types").PlatformEvent[]>(`/state/events?limit=${limit || 50}`)
  }

  async getWorkflows() {
    return this.request<any[]>("/state/workflows")
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HORUS APIs (Read-only observations)
  // ═══════════════════════════════════════════════════════════════════════════

  async horusObserve(query?: string) {
    const url = query ? `/horus/observe?query=${encodeURIComponent(query)}` : "/horus/observe"
    return this.request<{ content: string; timestamp: number; state_hash: string }>(url)
  }

  async horusFilesState() {
    return this.request("/horus/state/files")
  }

  async horusGapsState() {
    return this.request("/horus/state/gaps")
  }

  async horusEvidenceState() {
    return this.request("/horus/state/evidence")
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION APIs
  // ═══════════════════════════════════════════════════════════════════════════

  async getNotifications() {
    return this.request<import("./types").Notification[]>("/notifications")
  }

  async getUnreadNotifications() {
    return this.request<import("./types").Notification[]>("/notifications/unread")
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string; notificationId: string; read: boolean }>(`/notifications/${id}`, {
      method: "PUT",
    })
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string; count: number }>("/notifications/read-all", {
      method: "PUT",
    })
  }

  // AI
  async chat(messages: { role: "user" | "assistant"; content: string }[], context?: string) {
    return this.request<import("./types").AIResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, context }),
    })
  }

  async chatWithFiles(message: string, files: File[]) {
    const token = this.getToken()
    const formData = new FormData()
    formData.append("message", message)

    // Append all files
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response = await fetch(`${API_BASE_URL}/horus/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to process files" }))
      throw new Error(error.detail || "Failed to process files")
    }

    return response.json()
  }

  async horusChat(message: string, files?: File[]) {
    const token = this.getToken()
    const formData = new FormData()
    formData.append("message", message)

    if (files) {
      files.forEach((file) => {
        formData.append("files", file)
      })
    }

    const response = await fetch(`${API_BASE_URL}/horus/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Horus chat failed" }))
      throw new Error(error.detail || "Horus chat failed")
    }

    return response.json()
  }

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

  // Gap Analysis
  async generateGapAnalysis(standardId: string, assessmentId?: string) {
    return this.request<import("./types").GapAnalysis>("/gap-analysis/generate", {
      method: "POST",
      body: JSON.stringify({ standardId, assessmentId }),
    })
  }

  async getGapAnalyses() {
    return this.request<import("./types").GapAnalysisListItem[]>("/gap-analysis")
  }

  async getGapAnalysis(id: string) {
    return this.request<import("./types").GapAnalysis>(`/gap-analysis/${id}`)
  }

  async deleteGapAnalysis(id: string) {
    return this.request(`/gap-analysis/${id}`, { method: "DELETE" })
  }

  async archiveGapAnalysis(id: string, archived: boolean = true) {
    return this.request(`/gap-analysis/${id}/archive`, {
      method: "POST",
      body: JSON.stringify({ archived }),
    })
  }

  async getArchivedGapAnalyses() {
    return this.request<import("./types").GapAnalysisListItem[]>("/gap-analysis/archived/list")
  }

}

export const api = new ApiClient()

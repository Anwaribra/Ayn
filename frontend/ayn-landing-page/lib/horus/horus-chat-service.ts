/**
 * HORUS CHAT SERVICE
 * 
 * This service connects the chat interface to the Horus Brain.
 * When users chat with Horus, it has access to ALL platform context.
 */

import { api } from "@/lib/api"
import { 
  useHorusBrain, 
  AnalyzedFile, 
  HorusInsight, 
  HorusRecommendation 
} from "./horus-brain-context"

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  metadata?: {
    referencedFiles?: string[]
    referencedEvidence?: string[]
    referencedGaps?: string[]
    suggestedActions?: ChatAction[]
  }
}

export interface ChatAction {
  id: string
  label: string
  description?: string
  module: string
  handler: () => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// HORUS CHAT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class HorusChatService {
  private brain: ReturnType<typeof useHorusBrain>

  constructor(brain: ReturnType<typeof useHorusBrain>) {
    this.brain = brain
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT-AWARE CHAT
  // ═══════════════════════════════════════════════════════════════════════════

  async sendMessage(userMessage: string, attachedFiles?: string[]): Promise<ChatMessage> {
    // Build context-rich prompt (includes system instructions + context)
    const contextPrompt = this.buildContextPrompt(userMessage, attachedFiles)
    
    // Combine system prompt with user context
    const fullPrompt = `${this.getSystemPrompt()}\n\n---\n\n${contextPrompt}`
    
    // Send to API with full context
    try {
      const response = await api.chat([
        { role: "user", content: fullPrompt }
      ])

      // Process response for cross-module actions
      const processedResponse = this.processResponse(response.result || "")
      
      // Generate insights based on conversation
      this.generateInsights(userMessage, processedResponse.content, attachedFiles)
      
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content: processedResponse.content,
        timestamp: Date.now(),
        metadata: processedResponse.metadata
      }
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm having trouble connecting to my knowledge base. Please try again.",
        timestamp: Date.now()
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT BUILDING
  // ═══════════════════════════════════════════════════════════════════════════

  private buildContextPrompt(userMessage: string, attachedFiles?: string[]): string {
    const { state } = this.brain
    
    const sections: string[] = []
    
    // Section 1: Current Platform State
    sections.push(`
CURRENT PLATFORM STATE:
- Evidence Completeness: ${state.metrics.evidenceCompleteness}%
- Gap Resolution: ${state.metrics.gapResolutionRate}%
- ISO 21001 Progress: ${state.metrics.iso21001Progress}%
- Total Documents: ${state.metrics.totalDocuments}
- Open Gaps: ${state.gaps.filter(g => g.status === "open").length}
    `.trim())
    
    // Section 2: Recent Files (if any)
    if (state.files.length > 0) {
      const recentFiles = state.files.slice(-5)
      sections.push(`
RECENTLY UPLOADED FILES:
${recentFiles.map(f => {
  const analysis = f.analysis
  return `- ${f.name}${analysis ? ` (${analysis.documentType}, ${analysis.standard || "Unknown Standard"})` : ""}`
}).join("\n")}
      `.trim())
    }
    
    // Section 3: Attached Files (current message)
    if (attachedFiles && attachedFiles.length > 0) {
      const files = attachedFiles.map(id => this.brain.getFile(id)).filter(Boolean)
      sections.push(`
CURRENTLY ATTACHED FILES:
${files.map(f => `- ${f!.name}: ${f!.analysis?.summary || "Pending analysis"}`).join("\n")}
      `.trim())
    }
    
    // Section 4: Open Gaps
    const openGaps = state.gaps.filter(g => g.status === "open")
    if (openGaps.length > 0) {
      sections.push(`
OPEN COMPLIANCE GAPS:
${openGaps.slice(0, 5).map(g => `- ${g.clause}: ${g.description} (${g.severity})`).join("\n")}
      `.trim())
    }
    
    // Section 5: Recent Evidence
    if (state.evidence.length > 0) {
      const recentEvidence = state.evidence.slice(-5)
      sections.push(`
RECENT EVIDENCE:
${recentEvidence.map(e => `- ${e.title} (${e.status})${e.linkedCriteria ? ` [${e.linkedCriteria.join(", ")}]` : ""}`).join("\n")}
      `.trim())
    }
    
    // Section 6: User Query
    sections.push(`
USER QUESTION:
${userMessage}

IMPORTANT: Consider ALL the above context when responding. If the user asks about evidence, gaps, or documents, reference specific items from the context. Suggest cross-module actions where relevant.
    `.trim())
    
    return sections.join("\n\n---\n\n")
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT
  // ═══════════════════════════════════════════════════════════════════════════

  private getSystemPrompt(): string {
    return `
You are Horus AI, the central intelligence of the Ayn Platform - a Quality Assurance and Compliance Management System for educational institutions.

YOUR ROLE:
- You are NOT just a chatbot - you are the brain that connects ALL platform modules
- You have access to Evidence, Gap Analysis, Dashboard, and Archive modules
- You are an expert in ALL educational ISO standards, not just one

EDUCATIONAL STANDARDS YOU KNOW:
1. ISO 21001:2018 - Educational organizations management systems (EOMS)
2. ISO 9001:2015 - Quality management systems (applicable to education)
3. NAQAAE - National Authority for Quality Assurance and Accreditation of Education (Egypt)
4. ISO/IEC 17024 - Conformity assessment (certification programs)
5. ISO 29993 - Learning services outside formal education
6. ISO 29994 - E-learning quality

CAPABILITIES:
1. Analyze uploaded files and identify which standard(s) they relate to
2. Connect evidence to specific compliance gaps across ANY standard
3. Track progress across ALL standards simultaneously
4. Suggest actions that span multiple modules
5. Remember context across conversations

CROSS-MODULE THINKING:
When a user uploads a file:
- Analyze it against ALL relevant educational standards
- Suggest saving it to Evidence with appropriate standard tags
- Check if it addresses any Gap Analysis items (any standard)
- Note how it affects Dashboard metrics
- Recommend Archive tags

When a user asks about compliance:
- Consider ALL educational standards (ISO 21001, ISO 9001, NAQAAE, etc.)
- Check current Evidence status across standards
- Reference relevant Gaps (any standard)
- Suggest next steps across modules

TONE:
- Professional but approachable
- Always specific (reference actual items from context)
- Action-oriented (suggest concrete next steps)
- Educational (explain compliance concepts clearly)
- Comprehensive (consider multiple standards when relevant)

RESPONSE FORMAT:
Provide clear, structured responses. When suggesting actions, use this format:
[ACTION:module:description]
Example: [ACTION:evidence:Save this file as ISO 21001 Policy evidence]

If referencing specific items, be precise and mention the relevant standard:
"I see you have a gap in ISO 21001 Clause 4.1 (Context of the Organization). The policy document you uploaded yesterday could address this."

IMPORTANT: Always analyze files comprehensively. A single document might:
- Support ISO 21001 (educational management)
- Support ISO 9001 (quality management)  
- Support NAQAAE (local accreditation)
- Identify ALL applicable standards and clauses.
    `.trim()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  private processResponse(content: string): { 
    content: string
    metadata?: ChatMessage["metadata"]
  } {
    const actions: ChatAction[] = []
    
    // Extract action suggestions from response
    const actionRegex = /\[ACTION:(\w+):([^\]]+)\]/g
    let match
    let cleanContent = content
    
    while ((match = actionRegex.exec(content)) !== null) {
      const [fullMatch, module, description] = match
      actions.push({
        id: crypto.randomUUID(),
        label: description,
        description: `Take action in ${module}`,
        module,
        handler: () => this.executeAction(module, description)
      })
      // Remove action markers from displayed content
      cleanContent = cleanContent.replace(fullMatch, "")
    }
    
    // Find referenced entities
    const referencedFiles = this.extractFileReferences(content)
    const referencedEvidence = this.extractEvidenceReferences(content)
    const referencedGaps = this.extractGapReferences(content)
    
    return {
      content: cleanContent.trim(),
      metadata: {
        suggestedActions: actions,
        referencedFiles,
        referencedEvidence,
        referencedGaps
      }
    }
  }

  private executeAction(module: string, description: string) {
    // This would navigate to the module and pre-fill actions
    console.log(`Executing action: ${module} - ${description}`)
    // Implementation depends on router/navigation
  }

  private extractFileReferences(content: string): string[] {
    const { state } = this.brain
    const files: string[] = []
    
    state.files.forEach(file => {
      if (content.toLowerCase().includes(file.name.toLowerCase())) {
        files.push(file.id)
      }
    })
    
    return files
  }

  private extractEvidenceReferences(content: string): string[] {
    const { state } = this.brain
    const evidence: string[] = []
    
    state.evidence.forEach(item => {
      if (content.toLowerCase().includes(item.title.toLowerCase())) {
        evidence.push(item.id)
      }
    })
    
    return evidence
  }

  private extractGapReferences(content: string): string[] {
    const { state } = this.brain
    const gaps: string[] = []
    
    state.gaps.forEach(gap => {
      if (content.includes(gap.clause) || content.toLowerCase().includes(gap.description.toLowerCase())) {
        gaps.push(gap.id)
      }
    })
    
    return gaps
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  private generateInsights(userMessage: string, response: string, attachedFiles?: string[]) {
    const { state, addInsight, addRecommendation } = this.brain
    
    // Insight 1: File uploaded but not in evidence
    if (attachedFiles && attachedFiles.length > 0) {
      const unattachedFiles = attachedFiles.filter(fileId => {
        const file = state.files.find(f => f.id === fileId)
        return file && !state.evidence.some(e => e.files?.includes(fileId))
      })
      
      if (unattachedFiles.length > 0) {
        addInsight({
          type: "suggestion",
          title: "Files not linked to evidence",
          description: `${unattachedFiles.length} uploaded file(s) haven't been saved to Evidence module`,
          relatedModules: ["evidence", "horus-ai"],
          suggestedActions: unattachedFiles.map(fileId => ({
            label: "Save to Evidence",
            module: "evidence",
            action: () => console.log("Navigate to evidence with file", fileId)
          }))
        })
        
        addRecommendation({
          type: "file_to_evidence",
          priority: "medium",
          description: `Save uploaded files to Evidence module for compliance tracking`,
          sourceFiles: unattachedFiles,
          targetModule: "evidence",
          autoActionPossible: true
        })
      }
    }
    
    // Insight 2: Mentioned gaps that have suggested files
    state.gaps.forEach(gap => {
      if (gap.status === "open" && gap.suggestedFiles && gap.suggestedFiles.length > 0) {
        if (response.toLowerCase().includes(gap.clause.toLowerCase())) {
          addInsight({
            type: "suggestion",
            title: `Potential evidence for ${gap.clause}`,
            description: `You have ${gap.suggestedFiles.length} file(s) that might address this gap`,
            relatedModules: ["gap-analysis", "evidence"],
            suggestedActions: [{
              label: "Review Files",
              module: "gap-analysis",
              action: () => console.log("Navigate to gap", gap.id)
            }]
          })
        }
      }
    })
    
    // Insight 3: Low evidence completeness
    if (state.metrics.evidenceCompleteness < 50) {
      addInsight({
        type: "alert",
        title: "Evidence completeness below 50%",
        description: "Your compliance evidence is incomplete. Consider uploading more documentation.",
        relatedModules: ["evidence", "dashboard"]
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeFile(fileId: string): Promise<void> {
    const { getFile, analyzeFile, addInsight, addRecommendation } = this.brain
    const file = getFile(fileId)
    
    if (!file) return
    
    // Simulate AI analysis (in real implementation, this would call an API)
    const analysis = await this.performFileAnalysis(file)
    
    // Store analysis
    analyzeFile(fileId, analysis)
    
    // Generate insights based on analysis
    if (analysis?.standard) {
      addInsight({
        type: "completion",
        title: `File identified as ${analysis.standard} ${analysis.documentType}`,
        description: `"${file.name}" appears to be a ${analysis.documentType} document for ${analysis.standard}${analysis.clauses ? `, covering clauses: ${analysis.clauses.join(", ")}` : ""}`,
        relatedModules: ["evidence", "gap-analysis"]
      })
      
      // Suggest linking to evidence
      addRecommendation({
        type: "file_to_evidence",
        priority: "high",
        description: `Save "${file.name}" as ${analysis.standard} evidence`,
        sourceFiles: [fileId],
        targetModule: "evidence"
      })
      
      // Check if addresses any gaps
      if (analysis.clauses) {
        addRecommendation({
          type: "file_to_gap",
          priority: "medium",
          description: `Link this document to related compliance gaps`,
          sourceFiles: [fileId],
          targetModule: "gap-analysis"
        })
      }
    }
  }

  private async performFileAnalysis(file: AnalyzedFile): Promise<AnalyzedFile["analysis"]> {
    // In a real implementation, this would:
    // 1. Extract text from PDF/DOC/etc
    // 2. Send to AI for analysis
    // 3. Parse response for document type, standard, clauses
    
    // For now, return simulated analysis based on filename keywords
    // Supporting ALL educational ISO standards
    const name = file.name.toLowerCase()
    
    // ISO 9001 Quality Management
    if (name.includes("quality") || name.includes("جودة")) {
      if (name.includes("manual") || name.includes("كتيب")) {
        return {
          documentType: "manual",
          standard: "ISO 9001",
          clauses: ["4.1", "4.2", "4.3", "4.4"],
          summary: "Quality Management System Manual",
          keywords: ["quality manual", "QMS", "ISO 9001", "management system"],
          confidence: 0.9
        }
      }
      if (name.includes("policy") || name.includes("سياسة")) {
        return {
          documentType: "policy",
          standard: "ISO 9001",
          clauses: ["5.1", "5.2", "5.3"],
          summary: "Quality Policy aligned with ISO 9001 requirements",
          keywords: ["policy", "quality", "ISO 9001", "commitment"],
          confidence: 0.88
        }
      }
    }
    
    // ISO 21001 Educational Management
    if (name.includes("educational") || name.includes("تعليمي") || name.includes("eoms")) {
      return {
        documentType: "policy",
        standard: "ISO 21001",
        clauses: ["4.1", "4.2", "5.1", "6.1"],
        summary: "Educational Organization Management System (EOMS) document",
        keywords: ["education", "EOMS", "ISO 21001", "learning", "learner"],
        confidence: 0.92
      }
    }
    
    // NAQAAE (Egyptian accreditation)
    if (name.includes("naqaae") || name.includes("اعتماد") || name.includes("تقويم")) {
      return {
        documentType: "report",
        standard: "NAQAAE",
        clauses: ["Standard 1", "Standard 2", "Standard 3"],
        summary: "NAQAAE accreditation or self-assessment document",
        keywords: ["NAQAAE", "accreditation", "Egypt", "quality assurance"],
        confidence: 0.85
      }
    }
    
    // Generic Policy
    if (name.includes("policy") || name.includes("سياسة")) {
      return {
        documentType: "policy",
        standard: "ISO 21001",  // Default to educational standard
        clauses: ["4.1", "4.2", "5.1"],
        summary: "Institutional policy document (potentially covers ISO 21001 & ISO 9001)",
        keywords: ["policy", "institutional", "compliance"],
        confidence: 0.75
      }
    }
    
    // Procedures
    if (name.includes("procedure") || name.includes("procedure") || name.includes("إجراء")) {
      return {
        documentType: "procedure",
        standard: "ISO 21001",
        clauses: ["7.1", "7.2", "7.3"],
        summary: "Operational procedure document",
        keywords: ["procedure", "process", "steps", "operations"],
        confidence: 0.78
      }
    }
    
    // Curriculum / Learning
    if (name.includes("curriculum") || name.includes("منهج") || name.includes("curriculum")) {
      return {
        documentType: "curriculum",
        standard: "ISO 21001",
        clauses: ["6.2", "6.3", "8.1"],
        summary: "Curriculum design and development document",
        keywords: ["curriculum", "learning", "education", "program design"],
        confidence: 0.82
      }
    }
    
    // Assessment / Evaluation
    if (name.includes("assessment") || name.includes("تقييم") || name.includes("exam")) {
      return {
        documentType: "assessment",
        standard: "ISO 21001",
        clauses: ["8.2", "8.3", "9.1"],
        summary: "Assessment and evaluation procedures or records",
        keywords: ["assessment", "evaluation", "examination", "testing"],
        confidence: 0.8
      }
    }
    
    // Records / Evidence
    if (name.includes("record") || name.includes("سجل") || name.includes("form")) {
      return {
        documentType: "record",
        standard: null,
        summary: "Evidence record or form (may support multiple standards)",
        keywords: ["record", "evidence", "form", "data"],
        confidence: 0.65
      }
    }
    
    // Risk Management
    if (name.includes("risk") || name.includes("مخاطر")) {
      return {
        documentType: "risk_assessment",
        standard: "ISO 21001",
        clauses: ["6.1", "6.2", "9.3"],
        summary: "Risk assessment and management document",
        keywords: ["risk", "assessment", "mitigation", "opportunities"],
        confidence: 0.83
      }
    }
    
    // Default fallback
    return {
      documentType: "other",
      standard: null,
      summary: "Document uploaded for analysis against educational standards",
      keywords: [],
      confidence: 0.3
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  getQuickActions(): Array<{
    label: string
    description: string
    prompt: string
  }> {
    const { state } = this.brain
    
    // Dynamic quick actions covering ALL educational standards
    const actions = [
      {
        label: "Compare ISO Standards",
        description: "ISO 21001 vs ISO 9001 vs NAQAAE",
        prompt: "Compare the key differences and similarities between ISO 21001 (Educational Management), ISO 9001 (Quality Management), and NAQAAE standards. Which clauses overlap and how do they complement each other for educational institutions?"
      },
      {
        label: "Analyze My Documents",
        description: "Check compliance across all standards",
        prompt: "Analyze my uploaded documents and tell me which ISO 21001, ISO 9001, and NAQAAE requirements they cover. Identify gaps where I need more evidence."
      },
      {
        label: "Build Compliance Map",
        description: "See all standards together",
        prompt: "Create a comprehensive compliance map showing how ISO 21001, ISO 9001, and NAQAAE standards interact. Show me which documents can satisfy multiple standards simultaneously."
      }
    ]
    
    // Add contextual actions based on state
    if (state.files.length > 0) {
      const hasUnlinkedFiles = state.files.some(f => 
        !state.evidence.some(e => e.files?.includes(f.id))
      )
      
      if (hasUnlinkedFiles) {
        actions.unshift({
          label: "Analyze Uploaded Files",
          description: `${state.files.length} file(s) ready for analysis`,
          prompt: "Analyze all my uploaded files against ISO 21001, ISO 9001, and NAQAAE standards. Tell me what each file covers and which gaps they can address."
        })
      }
    }
    
    // If there are gaps with suggested files, prioritize that
    const gapsWithSuggestions = state.gaps.filter(g => g.suggestedFiles && g.suggestedFiles.length > 0)
    if (gapsWithSuggestions.length > 0) {
      actions.unshift({
        label: "Link Files to Gaps",
        description: `${gapsWithSuggestions.length} gaps have matching files`,
        prompt: "Show me which of my uploaded files can address specific compliance gaps across ISO 21001, ISO 9001, and NAQAAE standards."
      })
    }
    
    return actions.slice(0, 3) // Keep max 3
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function useHorusChat() {
  const brain = useHorusBrain()
  const service = new HorusChatService(brain)
  
  return {
    sendMessage: service.sendMessage.bind(service),
    analyzeFile: service.analyzeFile.bind(service),
    getQuickActions: service.getQuickActions.bind(service),
    getContextSummary: brain.getContextSummary
  }
}

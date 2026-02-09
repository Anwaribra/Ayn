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
- You help users navigate compliance (ISO 21001, ISO 9001, NAQAAE)

CAPABILITIES:
1. Analyze uploaded files and suggest where they fit in the compliance framework
2. Connect evidence to specific compliance gaps
3. Track progress across standards
4. Suggest actions that span multiple modules
5. Remember context across conversations

CROSS-MODULE THINKING:
When a user uploads a file:
- Suggest saving it to Evidence
- Check if it addresses any Gap Analysis items
- Note how it affects Dashboard metrics
- Recommend Archive tags

When a user asks about compliance:
- Check current Evidence status
- Reference relevant Gaps
- Suggest next steps across modules

TONE:
- Professional but approachable
- Always specific (reference actual items from context)
- Action-oriented (suggest concrete next steps)
- Educational (explain compliance concepts clearly)

RESPONSE FORMAT:
Provide clear, structured responses. When suggesting actions, use this format:
[ACTION:module:description]
Example: [ACTION:evidence:Save this file as ISO 21001 Policy evidence]

If referencing specific items, be precise:
"I see you have a gap in Clause 4.1 (Context of the Organization). The policy document you uploaded yesterday could address this."
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
    if (analysis.standard) {
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
    
    // For now, return simulated analysis based on filename
    const name = file.name.toLowerCase()
    
    if (name.includes("policy") || name.includes("سياسة")) {
      return {
        documentType: "policy",
        standard: "ISO 21001",
        clauses: ["4.1", "4.2", "5.1"],
        summary: "Quality policy document outlining institutional commitment",
        keywords: ["policy", "quality", "commitment", "objectives"],
        confidence: 0.85
      }
    }
    
    if (name.includes("procedure") || name.includes("إجراء")) {
      return {
        documentType: "procedure",
        standard: "ISO 21001",
        clauses: ["7.1", "7.2"],
        summary: "Operational procedure document",
        keywords: ["procedure", "process", "steps"],
        confidence: 0.78
      }
    }
    
    if (name.includes("record") || name.includes("سجل")) {
      return {
        documentType: "record",
        standard: null,
        summary: "Evidence record or form",
        keywords: ["record", "evidence"],
        confidence: 0.65
      }
    }
    
    return {
      documentType: "other",
      standard: null,
      summary: "Document uploaded for analysis",
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
    
    // Dynamic quick actions based on platform state
    const actions = [
      {
        label: "Explain ISO 21001",
        description: "Key clauses & requirements",
        prompt: "Explain the key requirements of ISO 21001 clause by clause, focusing on what an educational institution needs to implement."
      },
      {
        label: "Gap Analysis",
        description: "Identify compliance gaps",
        prompt: "Help me identify common compliance gaps in educational institutions and how to address them."
      },
      {
        label: "NAQAAE Guidance",
        description: "Self-assessment help",
        prompt: "Guide me through the NAQAAE self-assessment process. What are the main domains and required evidence?"
      }
    ]
    
    // Add contextual actions based on state
    if (state.gaps.filter(g => g.suggestedFiles && g.suggestedFiles.length > 0).length > 0) {
      actions.push({
        label: "Link Files to Gaps",
        description: "Connect uploaded files to gaps",
        prompt: "Show me which of my uploaded files can address specific compliance gaps."
      })
    }
    
    if (state.files.length > 0 && state.evidence.length === 0) {
      actions.push({
        label: "Save Files as Evidence",
        description: "Organize uploads in Evidence",
        prompt: "Help me organize my uploaded files into the Evidence module for compliance tracking."
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

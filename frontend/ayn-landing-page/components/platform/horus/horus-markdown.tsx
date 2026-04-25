import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

type ComplianceJsonPayload = {
  summary?: string
  overall_score?: number | string
  confidence?: number | string
  key_findings?: unknown
  improvement_suggestions?: unknown
  document_type?: string
  related_standard?: string
  mapped_criteria?: unknown
}

/** Strip leaked __THINKING__: or THINKING: protocol markers from displayed content */
function sanitizeHorusContent(content: string): string {
  const leakedProtocolLine =
    /^(?:__CHAT_ID__:[^\n]*|__THINKING__:[^\n]*|THINKING:[^\n]*|__FILE_STATUS__:\{.*\}|FILE_STATUS:\{.*\}|__FILE__:[^\n]*|FILE:\{.*\}|__TOOL_STEP__:\{.*\}|__ACTION_CONFIRM__:\{.*\}|__ACTION_RESULT__:\{.*\}|__STREAM_ERROR__:[^\n]*|__CONTEXT_LIMIT__:[^\n]*)$/gm
  const protocolPattern = /^(?:(?:__THINKING__:|THINKING:)(?:Searching conversation history|Generating response|Reading platform state|Reading your platform|Got it|Processing|Identified action|Executing|Prepared|Phase \d)[^\n]*(?:\n|\s*))*/
  return content
    .replace(leakedProtocolLine, "")
    .replace(protocolPattern, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
}

function extractComplianceJsonPayload(content: string): ComplianceJsonPayload | null {
  const candidates: string[] = []
  const fencedMatches = content.match(/```(?:json)?\s*([\s\S]*?)```/gi) ?? []

  for (const block of fencedMatches) {
    const inner = block.replace(/```(?:json)?/i, "").replace(/```$/, "").trim()
    if (inner.startsWith("{") && inner.endsWith("}")) {
      candidates.push(inner)
    }
  }

  const objectMatch = content.match(/\{[\s\S]*"overall_score"[\s\S]*\}/m)
  if (objectMatch) {
    candidates.push(objectMatch[0].trim())
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as ComplianceJsonPayload
      if (
        parsed &&
        (parsed.overall_score !== undefined ||
          toStringList(parsed.key_findings).length > 0 ||
          toStringList(parsed.improvement_suggestions).length > 0)
      ) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return null
}

function formatComplianceJsonPayload(payload: ComplianceJsonPayload, isArabic: boolean): string {
  const scoreValue = Number(payload.overall_score ?? payload.confidence ?? 0)
  const scoreLabel = Number.isFinite(scoreValue) ? `${Math.round(scoreValue)}/100` : null
  const findings = toStringList(payload.key_findings)
  const suggestions = toStringList(payload.improvement_suggestions)
  const mappedCriteria = toStringList(payload.mapped_criteria)
  const lines: string[] = []

  if (payload.summary) {
    lines.push(isArabic ? "### الملخص" : "### Summary")
    lines.push(String(payload.summary).trim())
    lines.push("")
  }

  if (scoreLabel) {
    lines.push(isArabic ? "### التقييم العام" : "### Overall Score")
    lines.push(`**${scoreLabel}**`)
    lines.push("")
  }

  if (payload.document_type || payload.related_standard || mappedCriteria.length > 0) {
    lines.push(isArabic ? "### سياق المستند" : "### Document Context")
    if (payload.document_type) {
      lines.push(`- ${isArabic ? "نوع المستند" : "Document type"}: ${payload.document_type}`)
    }
    if (payload.related_standard) {
      lines.push(`- ${isArabic ? "المعيار المرتبط" : "Related standard"}: ${payload.related_standard}`)
    }
    if (mappedCriteria.length > 0) {
      lines.push(`- ${isArabic ? "المعايير أو البنود المرتبطة" : "Mapped criteria"}: ${mappedCriteria.join(", ")}`)
    }
    lines.push("")
  }

  if (findings.length > 0) {
    lines.push(isArabic ? "### أهم الملاحظات" : "### Key Findings")
    lines.push(...findings.map((finding) => `- ${finding}`))
    lines.push("")
  }

  if (suggestions.length > 0) {
    lines.push(isArabic ? "### مقترحات التحسين" : "### Improvement Suggestions")
    lines.push(...suggestions.map((suggestion) => `- ${suggestion}`))
    lines.push("")
  }

  return lines.join("\n").trim()
}

function normalizeHorusContent(content: string): string {
  const sanitized = sanitizeHorusContent(content)
  const payload = extractComplianceJsonPayload(sanitized)

  if (!payload) return sanitized

  const withoutGenericIntro = sanitized
    .replace(/^.*json-formatted analysis.*\n*/im, "")
    .replace(/^.*raw json.*\n*/im, "")
    .trim()

  const preface = withoutGenericIntro
    .replace(/```(?:json)?[\s\S]*?```/gi, "")
    .replace(/\{[\s\S]*"overall_score"[\s\S]*\}/m, "")
    .trim()

  const isArabic = containsArabic(sanitized)
  const formatted = formatComplianceJsonPayload(payload, isArabic)

  return [preface, formatted].filter(Boolean).join("\n\n").trim()
}

export function HorusMarkdown({
    content,
    onAction
}: {
    content: string;
    onAction?: (action: string, payload: string) => void
}) {
    const sanitized = normalizeHorusContent(content)
    const isArabic = containsArabic(sanitized)

    return (
        <div
            dir="auto"
            className="prose prose-sm max-w-none text-[14px] leading-7 text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-p:my-0 prose-p:text-[0.97rem] prose-p:leading-7 prose-p:text-foreground/88 prose-strong:font-semibold prose-strong:text-foreground prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:my-4 prose-ul:space-y-2 prose-ul:ps-5 prose-ol:my-4 prose-ol:space-y-2 prose-ol:ps-5 prose-li:marker:text-primary prose-code:rounded-md prose-code:border prose-code:border-border prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-[var(--border-subtle)] prose-pre:bg-muted/30 prose-pre:p-4 prose-blockquote:my-4 prose-blockquote:rounded-r-2xl prose-blockquote:border-s-2 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:text-foreground/78 prose-hr:my-5 prose-hr:border-[var(--border-subtle)] prose-table:my-5 prose-table:w-full prose-table:overflow-hidden prose-table:rounded-xl prose-table:border prose-table:border-[var(--border-subtle)] prose-th:border prose-th:border-[var(--border-subtle)] prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2.5 prose-th:text-start prose-th:text-xs prose-th:font-semibold prose-th:text-foreground/80 prose-td:border prose-td:border-[var(--border-subtle)] prose-td:px-3 prose-td:py-2.5 prose-td:align-top prose-td:text-[13px]"
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h2: ({ children }: any) => <h2 className="mt-6 mb-3 text-base font-semibold text-foreground first:mt-0">{children}</h2>,
                    h3: ({ children }: any) => <h3 className="mt-5 mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</h3>,
                    p: ({ children }: any) => <p className="mb-3 last:mb-0 text-foreground/88">{children}</p>,
                    ul: ({ children }: any) => <ul className="mb-3 space-y-2 text-foreground/82">{children}</ul>,
                    ol: ({ children }: any) => <ol className="mb-3 space-y-2 text-foreground/82">{children}</ol>,
                    li: ({ children }: any) => <li className="ps-1">{children}</li>,
                    code: ({ className, children, ...props }: any) => {
                        const isBlock = /language-/.test(className || "")
                        return isBlock ? (
                            <code className="block w-full overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-muted/40 p-4 font-mono text-[12px] text-foreground/88" {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[12px] text-foreground" {...props}>
                                {children}
                            </code>
                        )
                    },
                    table: ({ children }: any) => (
                        <div className="my-6 w-full overflow-hidden rounded-2xl border border-border shadow-sm">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    {children}
                                </table>
                            </div>
                        </div>
                    ),
                    thead: ({ children }: any) => (
                        <thead className="bg-muted/50 text-xs uppercase text-foreground/80 border-b border-border">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }: any) => (
                        <tbody className="divide-y divide-border bg-background/50">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }: any) => (
                        <tr className="hover:bg-muted/30 transition-colors">
                            {children}
                        </tr>
                    ),
                    th: ({ children }: any) => (
                        <th className="px-4 py-3 font-semibold tracking-wide whitespace-nowrap">
                            {children}
                        </th>
                    ),
                    td: ({ children }: any) => (
                        <td className="px-4 py-3 align-top text-[13.5px] leading-relaxed text-foreground/90">
                            {children}
                        </td>
                    ),
                    blockquote: ({ children }: any) => (
                        <blockquote className="my-4 rounded-e-2xl border-s-2 border-primary/40 bg-primary/5 px-4 py-3 text-foreground/78">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }: any) => {
                        if (href?.startsWith('ACTION:')) {
                            const [_, type, payload] = href.split(':');
                            return (
                                <div
                                    onClick={() => onAction?.(type, payload)}
                                    className="my-2 inline-flex w-fit items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] p-2.5 pe-4 align-middle shadow-sm transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-md group cursor-pointer"
                                >
                                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "var(--status-success)" }}></span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">{children}</span>
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            {type === 'view_gap' ? 'View Document' : type === 'gap_report' ? 'Gap Report' : type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-modal)] text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    </div>
                                </div>
                            )
                        }
                        
                        if (/^[a-zA-Z0-9_\-\s\.]+\.(?:pdf|docx|doc|txt|png|jpg|jpeg|csv)$/i.test(children as string)) {
                           return (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <a
                                        href={`/platform/evidence?highlight=${encodeURIComponent((children as string).trim())}`}
                                        className="cursor-pointer font-semibold text-primary underline-offset-4 decoration-primary/30 transition-all hover:underline"
                                    >
                                        {children}
                                    </a>
                                  </HoverCardTrigger>
                                  <HoverCardContent side="top" align="start" className="w-64 z-[60] bg-[var(--surface-modal)]/95 backdrop-blur-md border-[var(--border-subtle)] shadow-xl p-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
                                     <div className="flex items-start gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                         <FileText className="w-4 h-4 text-primary" />
                                       </div>
                                       <div>
                                          <h4 className="line-clamp-2 text-xs font-semibold text-foreground">{children as string}</h4>
                                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Known Evidence</p>
                                       </div>
                                     </div>
                                     <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                                        <p className="text-xs text-muted-foreground">Click to open this file natively inside the platform Evidence Vault Split-View.</p>
                                     </div>
                                  </HoverCardContent>
                                </HoverCard>
                           )
                        }

                        return (
                            <a
                                href={href}
                                className="cursor-pointer font-semibold text-primary underline-offset-4 decoration-primary/30 transition-all hover:underline"
                            >
                                {children}
                            </a>
                        )
                    }
                }}
            >
                {isArabic ? sanitized.replace(/\n{3,}/g, "\n\n") : sanitized}
            </ReactMarkdown>
        </div>
    )
}

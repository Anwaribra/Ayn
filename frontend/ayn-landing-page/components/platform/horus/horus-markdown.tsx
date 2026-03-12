import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export function HorusMarkdown({
    content,
    onAction
}: {
    content: string;
    onAction?: (action: string, payload: string) => void
}) {
    return (
        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:glass-layer-2 prose-pre:border prose-pre:border-glass-border prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-4 text-foreground">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h2: ({ children }: any) => <h2 className="text-lg font-black mt-6 mb-3 flex items-center gap-2 text-foreground border-b border-border pb-2">{children}</h2>,
                    h3: ({ children }: any) => <h3 className="text-sm font-bold mt-4 mb-2 text-muted-foreground uppercase tracking-wide">{children}</h3>,
                    p: ({ children }: any) => <p className="mb-3 last:mb-0 text-foreground/90 font-medium leading-relaxed">{children}</p>,
                    ul: ({ children }: any) => <ul className="mb-3 space-y-1 text-muted-foreground">{children}</ul>,
                    li: ({ children }: any) => <li className="pl-1"><span className="mr-2">•</span>{children}</li>,
                    code: ({ className, children, ...props }: any) => {
                        const isBlock = /language-/.test(className || "")
                        return isBlock ? (
                            <code className="block rounded-xl glass-layer-2 p-4 font-mono text-[12px] text-muted-foreground overflow-x-auto w-full border border-glass-border" {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border" {...props}>
                                {children}
                            </code>
                        )
                    },
                    blockquote: ({ children }: any) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-1 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }: any) => {
                        if (href?.startsWith('ACTION:')) {
                            const [_, type, payload] = href.split(':');
                            return (
                                <div 
                                    onClick={() => onAction?.(type, payload)}
                                    className="inline-flex items-center gap-3 p-2.5 pr-4 my-2 align-middle glass-layer-2 rounded-2xl border border-[var(--border-subtle)] shadow-sm hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer w-fit"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 relative">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "var(--status-success)" }}></span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{children}</span>
                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                            {type === 'view_gap' ? 'View Document' : type === 'gap_report' ? 'Gap Report' : type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--surface-modal)] text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
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
                                        className="text-primary font-bold hover:underline underline-offset-4 decoration-2 decoration-primary/30 transition-all cursor-pointer"
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
                                          <h4 className="text-xs font-bold text-foreground line-clamp-2">{children as string}</h4>
                                          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">Known Evidence</p>
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
                                className="text-primary font-bold hover:underline underline-offset-4 decoration-2 decoration-primary/30 transition-all cursor-pointer"
                            >
                                {children}
                            </a>
                        )
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

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
                    code: ({ inline, children }: any) =>
                        inline ? (
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border">{children}</code>
                        ) : (
                            <code className="block rounded-xl glass-layer-2 p-4 font-mono text-[12px] text-muted-foreground overflow-x-auto w-full border border-glass-border">
                                {children}
                            </code>
                        ),
                    blockquote: ({ children }: any) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-1 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }: any) => {
                        if (href?.startsWith('ACTION:')) {
                            const [_, type, payload] = href.split(':');
                            return (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAction?.(type, payload)}
                                    className="mx-1 h-7 px-3 rounded-lg border-primary/30 bg-primary/5 text-primary hover:bg-primary/20 hover:text-primary font-black uppercase text-[10px] tracking-wider transition-all"
                                >
                                    {type === 'gap_report' ? <FileText className="w-3 h-3 mr-1.5" /> : null}
                                    {children}
                                </Button>
                            )
                        }
                        return (
                            <a
                                href={href}
                                className="text-primary font-bold hover:underline underline-offset-4 decoration-2 decoration-primary/30 transition-all"
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

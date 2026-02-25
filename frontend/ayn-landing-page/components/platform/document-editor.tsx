import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Play, Sparkles } from "lucide-react"

interface DocumentEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftContent: string
  onSave: (finalContent: string) => Promise<void>
  isSaving: boolean
}

export function DocumentEditor({ open, onOpenChange, draftContent, onSave, isSaving }: DocumentEditorProps) {
  const [content, setContent] = useState(draftContent)

  // Quick reset when new draft content comes in
  React.useEffect(() => {
    setContent(draftContent)
  }, [draftContent])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[var(--surface-modal)] border-[var(--border-light)] p-0 overflow-hidden flex flex-col h-[80vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-black italic text-[var(--text-primary)]">
            <Sparkles className="w-5 h-5 text-primary" />
            Horus Auto-Draft
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Review the generated remediation document. Edit if necessary, then save it as Evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Document content goes here..."
          />
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3 bg-muted/20">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSaving || !content}
            onClick={() => onSave(content)}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Save as Evidence
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

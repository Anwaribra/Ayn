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
      <DialogContent className="glass-surface-strong max-w-4xl p-0 overflow-hidden flex flex-col h-[80vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="glass-text-primary flex items-center gap-2 text-xl font-black italic">
            <Sparkles className="w-5 h-5 text-primary" />
            Horus Auto-Draft
          </DialogTitle>
          <DialogDescription className="glass-text-secondary">
            Review the generated remediation document. Edit if necessary, then save it as Evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="glass-input glass-text-primary flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder="Document content goes here..."
          />
        </div>

        <div className="glass-border flex items-center justify-end gap-3 border-t p-4">
          <button
            onClick={() => onOpenChange(false)}
            className="glass-button glass-text-secondary px-6 py-2 text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSaving || !content}
            onClick={() => onSave(content)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
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

"use client"

import { X, ArrowRight, CheckCircle2 } from "lucide-react"
import type { WorkflowTemplate } from "./types"

export function WorkflowTemplatePreviewModal({
  template,
  onClose,
  onUseTemplate,
}: {
  template: WorkflowTemplate
  onClose: () => void
  onUseTemplate: (t: WorkflowTemplate) => void
}) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close template preview" />
      <div className="relative w-full max-w-lg glass-panel glass-border rounded-[28px] p-6 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${template.glow} opacity-40 pointer-events-none`} />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{template.category}</div>
              <h3 className="text-xl font-bold text-foreground">{template.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
            <button type="button" className="p-2 rounded-lg glass-button shrink-0" onClick={onClose}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pipeline Steps</div>
            {template.steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 glass-panel glass-border rounded-xl p-3">
                <div className="w-7 h-7 rounded-full border border-[var(--glass-border)] bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{step.label}</div>
                  <div className="text-[10px] text-muted-foreground">{step.detail}</div>
                </div>
                {i < template.steps.length - 1 ? (
                  <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)] ml-auto shrink-0" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
              onClick={() => onUseTemplate(template)}
            >
              Use Template
            </button>
            <button type="button" className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

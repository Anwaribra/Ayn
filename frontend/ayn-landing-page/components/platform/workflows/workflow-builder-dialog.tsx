"use client"

import { X } from "lucide-react"
import { TRIGGER_STEPS, DEFAULT_STEPS } from "./constants"

export function WorkflowBuilderDialog({
  open,
  builderWorkflowId,
  builderTemplate,
  builderName,
  builderDescription,
  builderTrigger,
  onBuilderNameChange,
  onBuilderDescriptionChange,
  onBuilderTriggerChange,
  onClose,
  onSave,
}: {
  open: boolean
  builderWorkflowId: string | null
  builderTemplate: string | null
  builderName: string
  builderDescription: string
  builderTrigger: string
  onBuilderNameChange: (v: string) => void
  onBuilderDescriptionChange: (v: string) => void
  onBuilderTriggerChange: (v: string) => void
  onClose: () => void
  onSave: () => void
}) {
  if (!open) return null

  const builderSteps = TRIGGER_STEPS[builderTrigger] ?? DEFAULT_STEPS

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close workflow builder" />
      <div className="relative glass-panel glass-border w-full max-w-2xl rounded-[28px] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {builderWorkflowId ? "Edit automation" : builderTemplate ? `New from "${builderTemplate}"` : "New automation"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">Define what runs and when it triggers.</p>
          </div>
          <button type="button" className="p-2 rounded-lg glass-button shrink-0" onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
              <input
                value={builderName}
                onChange={(e) => onBuilderNameChange(e.target.value)}
                placeholder="e.g. Evidence intake pipeline"
                className="w-full h-10 glass-input rounded-xl px-3 text-sm text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea
                value={builderDescription}
                onChange={(e) => onBuilderDescriptionChange(e.target.value)}
                placeholder="What does this automation do?"
                rows={3}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm text-foreground resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trigger</label>
              <select
                value={builderTrigger}
                onChange={(e) => onBuilderTriggerChange(e.target.value)}
                className="w-full h-10 glass-input rounded-xl px-3 text-sm text-foreground"
              >
                {["On Upload", "On Evidence Update", "On Analysis Request"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Default Pipeline Steps</div>
            <div className="space-y-2">
              {builderSteps.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-[var(--glass-border)] bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{step.label}</div>
                    <div className="text-[10px] text-muted-foreground">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
              Steps are preconfigured for this trigger type. Full step customization is coming in a future release.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
            onClick={onSave}
          >
            {builderWorkflowId ? "Save Changes" : "Save automation"}
          </button>
        </div>
      </div>
    </div>
  )
}

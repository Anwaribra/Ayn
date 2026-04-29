"use client"

import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowTemplate } from "./types"

export function WorkflowTemplateStrip({
  filteredTemplates,
  templateFilter,
  onFilterChange,
  onUseTemplate,
  onPreview,
}: {
  filteredTemplates: WorkflowTemplate[]
  templateFilter: "all" | "Evidence" | "Reporting" | "Gaps"
  onFilterChange: (c: typeof templateFilter) => void
  onUseTemplate: (tpl: WorkflowTemplate) => void
  onPreview: (tpl: WorkflowTemplate) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">Start from a template</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "Evidence", "Reporting", "Gaps"] as const).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onFilterChange(category)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                templateFilter === category ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 glass-border text-center sm:col-span-2 xl:col-span-3">
            <Layers className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No templates in this category</p>
          </div>
        ) : (
          filteredTemplates.map((tpl) => (
            <div key={tpl.id} className="glass-panel rounded-2xl p-4 glass-border relative overflow-hidden flex flex-col gap-3">
              <div className={`absolute inset-0 bg-gradient-to-br ${tpl.glow} opacity-50 pointer-events-none`} />
              <div className="relative z-10 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center shrink-0">
                  <tpl.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{tpl.category}</div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{tpl.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
                </div>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                  onClick={() => onUseTemplate(tpl)}
                >
                  Use template
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground"
                  onClick={() => onPreview(tpl)}
                >
                  Preview
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

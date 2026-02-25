"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Shield,
  Globe,
  Award,
  GraduationCap,
  Building2,
  Check,
  ChevronRight,
  Search,
  X,
  Sparkles,
  FileCheck,
  Target,
  Clock,
  Loader2,
} from "lucide-react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { type Standard } from "@/types/standards"

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Globe,
  Building2,
  Shield,
  Award,
  FileCheck,
  BookOpen,
}

interface Template extends Omit<Standard, "description" | "code" | "category" | "region" | "estimatedSetup"> {
  name: string
  description: string
  code: string
  category: string
  region: string
  estimatedSetup: string
  criteriaCount: number
  iconComponent: React.ElementType
  color: string
}

// Hardcoded fallback or reference moved to database seed

interface StandardsTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: Template) => void
}

export function StandardsTemplates({ isOpen, onClose, onSelect }: StandardsTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const { data: rawStandards, isLoading } = useSWR(isOpen ? "standards" : null, () => api.getStandards())

  const templates: Template[] = (rawStandards || []).map(std => ({
    ...std,
    name: std.title,
    code: std.code || "",
    category: std.category || "Uncategorized",
    description: std.description || "",
    region: std.region || "Unknown",
    features: std.features || [],
    estimatedSetup: std.estimatedSetup || "Unknown",
    iconComponent: iconMap[std.icon || ""] || GraduationCap,
    color: std.color || "from-blue-600 to-indigo-600"
  }))

  const categories = Array.from(new Set(templates.map(t => t.category)))

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-5xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="standards-library-title"
          >
            <div className="glass-panel rounded-3xl border-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="standards-library-title" className="text-xl font-bold text-foreground">Standards Library</h2>
                      <p className="text-xs text-muted-foreground">Browse pre-built compliance frameworks</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
                  aria-label="Close standards library"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filters */}
              <div className="p-6 border-b border-border space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standards (e.g., ISO, NCAAA, AdvancED)..."
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      selectedCategory === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="p-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                      <motion.div
                        key={template.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "group relative p-5 rounded-2xl border transition-all cursor-pointer",
                          selectedTemplate?.id === template.id
                            ? "bg-accent border-primary/50"
                            : "bg-muted/30 border-border hover:bg-muted/50 hover:border-border"
                        )}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                            template.color
                          )}>
                            <template.iconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-white truncate">{template.name}</h3>
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground font-medium">
                                {template.code}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {template.criteriaCount} criteria
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {template.estimatedSetup}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedTemplate?.id === template.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 pt-4 border-t border-border"
                          >
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Key Features</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {template.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] text-foreground"
                                >
                                  <Check className="w-3 h-3 text-[var(--status-success)]" />
                                  {feature}
                                </span>
                              ))}
                            </div>
                            <Button
                              onClick={() => onSelect(template)}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-2" />
                              Import {template.name}
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No standards found matching your criteria.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredTemplates.length} of {templates.length} frameworks
                </p>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function StandardsTemplatesButton({ onSelect }: { onSelect: (template: Template) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-border hover:bg-muted text-muted-foreground"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Browse Templates
      </Button>
      <StandardsTemplates
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(template) => {
          onSelect(template)
          setIsOpen(false)
        }}
      />
    </>
  )
}

export type { Template }

"use client"

import { useState } from "react"
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
} from "lucide-react"

interface Template {
  id: string
  name: string
  code: string
  category: string
  description: string
  region: string
  criteriaCount: number
  icon: React.ElementType
  color: string
  features: string[]
  estimatedSetup: string
}

const templates: Template[] = [
  {
    id: "ncaaa",
    name: "NCAAA Standards",
    code: "NCAAA-2024",
    category: "Higher Education",
    description: "National Commission for Academic Accreditation and Assessment standards for Saudi Arabian universities and colleges.",
    region: "Saudi Arabia",
    criteriaCount: 11,
    icon: GraduationCap,
    color: "from-emerald-600 to-teal-600",
    features: ["Institutional Effectiveness", "Learning Resources", "Research Standards", "Community Engagement"],
    estimatedSetup: "2-3 days",
  },
  {
    id: "iso21001",
    name: "ISO 21001:2018",
    code: "ISO-21001",
    category: "International",
    description: "Educational organizations management systems. International standard for educational management excellence.",
    region: "International",
    criteriaCount: 42,
    icon: Globe,
    color: "from-blue-600 to-indigo-600",
    features: ["Learner-Centered Approach", "Lifelong Learning", "Social Responsibility", "Customized Learning"],
    estimatedSetup: "5-7 days",
  },
  {
    id: "advanced",
    name: "AdvancED Standards",
    code: "ADV-ED",
    category: "K-12 Education",
    description: "Comprehensive K-12 accreditation standards used by 40,000+ institutions across 80 countries.",
    region: "Global",
    criteriaCount: 31,
    icon: Building2,
    color: "from-amber-600 to-orange-600",
    features: ["Leadership Capacity", "Learning Progress", "Resource Utilization", "Stakeholder Engagement"],
    estimatedSetup: "3-5 days",
  },
  {
    id: "moe",
    name: "Ministry of Education UAE",
    code: "MOE-UAE",
    category: "Government Framework",
    description: "United Arab Emirates Ministry of Education standards for institutional licensing and accreditation.",
    region: "UAE",
    criteriaCount: 18,
    icon: Shield,
    color: "from-rose-600 to-pink-600",
    features: ["Quality Assurance", "Student Welfare", "Academic Programs", "Faculty Standards"],
    estimatedSetup: "2-4 days",
  },
  {
    id: "qaa",
    name: "QAA UK Standards",
    code: "QAA-UK",
    category: "Higher Education",
    description: "Quality Assurance Agency for Higher Education standards used across UK universities.",
    region: "United Kingdom",
    criteriaCount: 28,
    icon: Award,
    color: "from-purple-600 to-violet-600",
    features: ["Academic Standards", "Quality Enhancement", "Student Voice", "Research Integrity"],
    estimatedSetup: "4-6 days",
  },
  {
    id: "naqaa",
    name: "NAQAAE Egypt",
    code: "NAQAAE-EG",
    category: "National Authority",
    description: "National Authority for Quality Assurance and Accreditation of Education framework for Egyptian institutions.",
    region: "Egypt",
    criteriaCount: 15,
    icon: FileCheck,
    color: "from-cyan-600 to-blue-600",
    features: ["Institutional Mission", "Governance Structure", "Educational Programs", "Assessment Systems"],
    estimatedSetup: "3-4 days",
  },
]

interface StandardsTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: Template) => void
}

export function StandardsTemplates({ isOpen, onClose, onSelect }: StandardsTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

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
          >
            <div className="glass-panel rounded-3xl border-white/10 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Standards Library</h2>
                      <p className="text-xs text-zinc-500">Browse pre-built compliance frameworks</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filters */}
              <div className="p-6 border-b border-white/5 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standards (e.g., ISO, NCAAA, AdvancED)..."
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      selectedCategory === null
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
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
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
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
                            ? "bg-white/[0.08] border-blue-500/50"
                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                        )}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                            template.color
                          )}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-white truncate">{template.name}</h3>
                              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-zinc-400 font-medium">
                                {template.code}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{template.description}</p>
                            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
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
                            className="mt-4 pt-4 border-t border-white/5"
                          >
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Key Features</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {template.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-[10px] text-zinc-300"
                                >
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  {feature}
                                </span>
                              ))}
                            </div>
                            <Button
                              onClick={() => onSelect(template)}
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
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
                    <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <p className="text-sm text-zinc-500">No standards found matching your criteria.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Showing {filteredTemplates.length} of {templates.length} frameworks
                </p>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/10 text-zinc-300 hover:bg-white/5"
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
        className="border-white/10 hover:bg-white/5 text-zinc-300"
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

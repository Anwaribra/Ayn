"use client"

import { useState } from "react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"
import { FileCheck, ClipboardList, Upload, BarChart3, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  {
    id: "standards",
    icon: FileCheck,
    label: "Standards",
    title: "Standards Management",
    description:
      "Organize and track ISO 21001 and NAQAAE standards in a clear, hierarchical structure. Map requirements to evidence and monitor compliance in real-time.",
    features: ["Hierarchical organization", "Requirement mapping", "Compliance tracking"],
  },
  {
    id: "assessments",
    icon: ClipboardList,
    label: "Assessments",
    title: "Assessment Workflows",
    description:
      "Streamlined evaluation process from draft to submission to review. Automated notifications and status tracking keep everyone aligned.",
    features: ["Draft → Submit → Review", "Automated notifications", "Progress tracking"],
  },
  {
    id: "evidence",
    icon: Upload,
    label: "Evidence",
    title: "Evidence Collection",
    description:
      "Centralized evidence repository with smart categorization. Tag, search, and link evidence to specific standards effortlessly.",
    features: ["Smart categorization", "Full-text search", "Standard linking"],
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Analytics",
    title: "Real-time Analytics",
    description:
      "Comprehensive dashboards showing compliance status, progress metrics, and actionable insights. Export reports for stakeholders.",
    features: ["Live dashboards", "Progress metrics", "Report generation"],
  },
  {
    id: "team",
    icon: Users,
    label: "Team",
    title: "Team Collaboration",
    description:
      "Assign reviewers, manage roles, and track contributions. Built-in communication tools keep your team connected.",
    features: ["Role management", "Task assignment", "Activity tracking"],
  },
  {
    id: "config",
    icon: Settings,
    label: "Config",
    title: "Customization",
    description:
      "Tailor Ayn to your institution's needs. Custom workflows, branding, and integration options give you full control.",
    features: ["Custom workflows", "White labeling", "API access"],
  },
]

export function InteractiveTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const active = tabs.find((t) => t.id === activeTab) || tabs[0]

  return (
    <section id="features" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-widest text-zinc-500 mb-4">
            Explore Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
        </ScrollAnimationWrapper>

        {/* Tab Navigation */}
        <ScrollAnimationWrapper className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-zinc-100 text-black"
                    : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-zinc-800/50",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Tab Content */}
        <ScrollAnimationWrapper>
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-14 h-14 rounded-xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-6">
                  <active.icon className="w-7 h-7 text-zinc-300" />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-zinc-100 mb-4">{active.title}</h3>
                <p className="text-zinc-400 mb-6 leading-relaxed">{active.description}</p>
                <ul className="space-y-3">
                  {active.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Preview */}
              <div className="relative aspect-square rounded-xl bg-zinc-950/50 border border-zinc-800/30 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl bg-zinc-700/20 rounded-full scale-150 animate-pulse" />
                    <div className="relative w-32 h-32 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center">
                      <active.icon className="w-16 h-16 text-zinc-400" />
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-4 left-4 w-20 h-6 rounded bg-zinc-800/50 animate-pulse" />
                <div
                  className="absolute top-4 right-4 w-12 h-6 rounded bg-zinc-800/50 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="absolute bottom-4 left-4 w-16 h-8 rounded bg-zinc-800/50 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
                <div
                  className="absolute bottom-4 right-4 w-24 h-8 rounded bg-zinc-800/50 animate-pulse"
                  style={{ animationDelay: "0.6s" }}
                />
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  )
}

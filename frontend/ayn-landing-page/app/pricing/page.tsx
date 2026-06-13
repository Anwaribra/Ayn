"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { DemoModal } from "@/components/landing/DemoModal"
import { Check, X } from "lucide-react"

export default function PricingPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  const triggerDemo = () => setDemoOpen(true)

  const plans = [
    {
      name: "Pilot",
      badge: "Free",
      desc: "For individuals or small evaluation teams.",
      priceDisplay: "Free",
      billingText: "No credit card required",
      ctaText: "Start for Free",
      popular: false,
      features: [
        "Basic Evidence Mapping",
        "Limited Horus AI Queries (50/mo)",
        "1 Accreditation Workflow",
        "Community Support",
      ],
    },
    {
      name: "Faculty",
      badge: "Most Popular",
      desc: "For departments or single campuses.",
      priceDisplay: "Volume Based",
      billingText: "Tailored to your institution size",
      ctaText: "Get a Quote",
      popular: true,
      features: [
        "Advanced Evidence Mapping",
        "Unlimited Horus AI Queries",
        "Up to 10 Workflows",
        "Custom Frameworks Support",
        "Standard Email Support",
      ],
    },
    {
      name: "Enterprise",
      badge: "Custom",
      desc: "For multi-campus universities and large institutions.",
      priceDisplay: "Custom",
      billingText: "Designed for scale",
      ctaText: "Contact Sales",
      popular: false,
      features: [
        "Dedicated Infrastructure",
        "Custom LLM Fine-Tuning",
        "Unlimited Workflows",
        "Advanced RBAC & SSO",
        "White-Glove Support (24/7)",
      ],
    },
  ]

  const comparisonFeatures = [
    {
      category: "Core Features",
      items: [
        { name: "Evidence Mapping", pilot: "Basic", faculty: "Advanced", enterprise: "Advanced" },
        { name: "Workflows", pilot: "1", faculty: "10", enterprise: "Unlimited" },
        { name: "Custom Frameworks", pilot: false, faculty: true, enterprise: true },
        { name: "File Storage", pilot: "5 GB", faculty: "100 GB", enterprise: "Unlimited" },
      ]
    },
    {
      category: "Horus AI",
      items: [
        { name: "AI Queries", pilot: "50/mo", faculty: "Unlimited", enterprise: "Unlimited" },
        { name: "Document Analysis", pilot: true, faculty: true, enterprise: true },
        { name: "Mock Audits", pilot: false, faculty: true, enterprise: true },
        { name: "Custom Fine-Tuning", pilot: false, faculty: false, enterprise: true },
      ]
    },
    {
      category: "Security & Support",
      items: [
        { name: "Data Encryption", pilot: true, faculty: true, enterprise: true },
        { name: "SSO Integration", pilot: false, faculty: false, enterprise: true },
        { name: "Dedicated Infra", pilot: false, faculty: false, enterprise: true },
        { name: "Support", pilot: "Community", faculty: "Standard", enterprise: "White-Glove 24/7" },
      ]
    }
  ]

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-foreground font-sans pb-32">
      <LandingNavbar onOpenDemo={triggerDemo} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-32 md:pt-40 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-foreground"
          >
            Simple, transparent pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground md:text-xl"
          >
            Choose the perfect plan for your institution's quality assurance needs. No hidden fees, no surprise limits.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-start">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
              className={`relative flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? 'ring-2 ring-primary shadow-md md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-1 text-center text-xs font-semibold text-white shadow-sm">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">{plan.desc}</p>
              </div>

              <div className="mb-6 flex items-baseline text-foreground h-12">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{plan.priceDisplay}</span>
              </div>
              
              <div className="mb-6 h-4">
                <p className="text-xs text-muted-foreground">{plan.billingText}</p>
              </div>

              <button
                onClick={triggerDemo}
                className={`w-full rounded-full px-4 py-3 text-sm font-bold transition-all active:scale-95 ${plan.popular ? 'bg-primary text-white hover:bg-primary/90 shadow-md' : 'bg-slate-100 text-foreground hover:bg-slate-200'}`}
              >
                {plan.ctaText}
              </button>

              <div className="space-y-4 pt-8 mt-8 border-t border-slate-100">
                <p className="text-sm font-semibold text-foreground">What's included:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comprehensive Features Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 max-w-5xl mx-auto rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Compare features in detail</h2>
            <p className="mt-4 text-muted-foreground">Find out exactly what you get with each plan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="w-2/5 py-4 pl-4 pr-2 font-bold text-foreground">Features</th>
                  <th className="w-1/5 py-4 px-2 font-bold text-foreground text-center">Pilot</th>
                  <th className="w-1/5 py-4 px-2 font-bold text-primary text-center">Faculty</th>
                  <th className="w-1/5 py-4 px-2 font-bold text-foreground text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonFeatures.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr>
                      <td colSpan={4} className="py-6 pl-4 pr-2 text-sm font-bold uppercase tracking-wider text-muted-foreground bg-white">
                        {category.category}
                      </td>
                    </tr>
                    {category.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 pl-4 pr-2 text-sm text-foreground font-medium flex items-center gap-1.5">
                          {item.name}
                        </td>
                        <td className="py-4 px-2 text-center">
                          {typeof item.pilot === 'boolean' ? (
                            item.pilot ? <Check className="mx-auto h-5 w-5 text-slate-400" /> : <X className="mx-auto h-5 w-5 text-slate-200" />
                          ) : (
                            <span className="text-sm text-slate-500">{item.pilot}</span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center bg-primary/[0.02] group-hover:bg-primary/[0.04] transition-colors">
                          {typeof item.faculty === 'boolean' ? (
                            item.faculty ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-slate-200" />
                          ) : (
                            <span className="text-sm font-semibold text-slate-900">{item.faculty}</span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center">
                          {typeof item.enterprise === 'boolean' ? (
                            item.enterprise ? <Check className="mx-auto h-5 w-5 text-slate-900" /> : <X className="mx-auto h-5 w-5 text-slate-200" />
                          ) : (
                            <span className="text-sm text-slate-600">{item.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} defaultType="pricing" />
    </div>
  )
}

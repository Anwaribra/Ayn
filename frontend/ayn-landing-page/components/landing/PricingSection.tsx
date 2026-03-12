"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Building2, Crown } from "lucide-react"
import Link from "next/link"

const DARK_BG = "#050810"

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individual educators exploring compliance",
    icon: Sparkles,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-white/10",
    features: [
      "1 Standard framework",
      "10 Evidence uploads",
      "Basic Horus AI chat",
      "Gap analysis (1 per month)",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For institutions serious about accreditation",
    icon: Building2,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    features: [
      "Unlimited standards",
      "Unlimited evidence uploads",
      "Full Horus AI with Brain Mode",
      "Unlimited gap analyses",
      "Mock audit sessions",
      "PDF & CSV exports",
      "Priority support",
      "5 team members",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large institutions and university systems",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "Custom integrations (LMS, SIS)",
      "Dedicated account manager",
      "On-premise deployment option",
      "Custom AI training",
      "SLA guarantee",
      "Audit trail & compliance logs",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@ayn-edu.com",
    popular: false,
  },
]

const testimonials = [
  {
    quote: "Horus AI reduced our accreditation preparation time by 60%. What used to take months now takes weeks.",
    author: "Dr. Sarah Al-Rashid",
    role: "Quality Director",
    institution: "King Saud University",
  },
  {
    quote: "The gap analysis feature identified compliance blind spots we'd missed for years. Game-changing.",
    author: "Prof. Ahmed Hassan",
    role: "Dean of Academic Affairs",
    institution: "Cairo University",
  },
  {
    quote: "Finally, a platform that understands educational quality standards natively. Not just a generic tool.",
    author: "Dr. Fatima Al-Harbi",
    role: "Accreditation Lead",
    institution: "Princess Nourah University",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden rounded-[1.75rem]" style={{ backgroundColor: DARK_BG, boxShadow: "0 10px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.08), transparent 65%)" }} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">Start free and scale as your institution grows. No hidden fees.</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative p-6 rounded-2xl border ${plan.popular ? "border-primary/40 bg-white/[0.04]" : "border-white/[0.08] bg-white/[0.02]"} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.2em] font-bold text-primary bg-primary/20 px-3 py-1 rounded-full border border-primary/30">Most Popular</div>
              )}
              <div className={`w-10 h-10 rounded-xl ${plan.bg} flex items-center justify-center mb-4`}>
                <plan.icon className={`w-5 h-5 ${plan.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-white/40 mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/40">{plan.period}</span>}
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={`block text-center py-3 px-6 rounded-xl text-sm font-semibold transition-all ${plan.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/10"}`}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Social Proof / Testimonials */}
        <div className="text-center mb-12">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Testimonials</span>
          <h2 className="text-2xl font-bold text-white mb-3">Trusted by leading institutions</h2>
          <p className="text-white/40 text-sm">See what quality professionals are saying about Ayn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.author}</p>
                <p className="text-xs text-white/40">{t.role}, {t.institution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

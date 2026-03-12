"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Building2, Crown, Clock } from "lucide-react"
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
    features: [
      "1 Standard framework",
      "10 Evidence uploads",
      "Basic Horus AI chat",
      "Gap analysis (1 per month)",
      "Community support",
    ],
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
    popular: false,
  },
]


export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden rounded-[1.75rem]" style={{ backgroundColor: DARK_BG, boxShadow: "0 10px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.08), transparent 65%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Clock className="w-3 h-3" />
            Pricing — Coming Soon
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">We&apos;re finalizing our plans. Start free today and lock in early-adopter benefits.</p>
        </div>

        {/* Plans Grid — visually muted with overlay */}
        <div className="relative mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none select-none blur-[1px]">
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
                <div className="block text-center py-3 px-6 rounded-xl text-sm font-semibold bg-white/[0.06] text-white border border-white/10">
                  Coming Soon
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center px-8 py-10 rounded-3xl bg-[#050810]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl max-w-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5 border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pricing Coming Soon</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                We&apos;re crafting the perfect plans for every institution size. Sign up now to get free early access and be the first to know when pricing launches.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Sparkles className="w-4 h-4" />
                Get Early Access — Free
              </Link>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  )
}

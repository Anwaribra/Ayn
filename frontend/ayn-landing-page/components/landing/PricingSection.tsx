"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Building2, Crown, Clock } from "lucide-react"
import Link from "next/link"

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
    <section id="pricing" className="relative overflow-hidden rounded-3xl bg-transparent text-white">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.08), transparent 65%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="glass-pill mb-3 inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            <Clock className="w-3 h-3" />
            Pricing — Coming Soon
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="glass-text-secondary max-w-lg mx-auto text-sm">We&apos;re finalizing our plans. Start free today and lock in early-adopter benefits.</p>
        </div>

        {/* Plans Grid — visually muted with overlay */}
        <div className="relative mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-none select-none opacity-26 blur-[1px] brightness-[0.55] contrast-90 saturate-75">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl ${plan.popular ? "border-primary/24 bg-white/[0.05] shadow-[0_20px_56px_-28px_rgba(59,130,246,0.22)]" : "border-white/[0.07] bg-white/[0.03] shadow-[0_18px_46px_-30px_rgba(0,0,0,0.5)]"}`}
              >
                {plan.popular && (
                  <div className="glass-pill absolute -top-3 left-1/2 -translate-x-1/2 border-primary/20 bg-primary/12 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Most Popular</div>
                )}
                <div className={`w-10 h-10 rounded-xl ${plan.bg} flex items-center justify-center mb-4`}>
                  <plan.icon className={`w-5 h-5 ${plan.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="glass-text-secondary mt-1 mb-4 text-xs">{plan.description}</p>
                <div className="mb-6">
                  {plan.popular ? (
                    <div className="glass-pill inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                      Coming Soon
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="glass-text-secondary text-sm">{plan.period}</span>}
                    </>
                  )}
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="glass-text-secondary flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="glass-button block rounded-xl px-6 py-3 text-center text-sm font-semibold text-white/78">
                  Coming Soon
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[rgba(5,8,16,0.34)] backdrop-blur-[2px]" />
            <div className="absolute left-1/2 top-[42%] h-28 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-[rgba(5,8,16,0.56)] md:top-[40%]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass-surface-strong glass-text-primary relative -translate-y-10 max-w-md rounded-3xl bg-[rgba(10,12,18,0.84)] px-8 py-10 text-center shadow-[0_24px_64px_-30px_rgba(0,0,0,0.62)] md:-translate-y-12"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pricing Coming Soon</h3>
              <p className="glass-text-secondary mb-6 text-sm leading-relaxed">
                We&apos;re crafting the perfect plans for every institution size. Sign up now to get free early access and be the first to know when pricing launches.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_-20px_rgba(37,99,235,0.55)] transition-colors hover:bg-primary/90"
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

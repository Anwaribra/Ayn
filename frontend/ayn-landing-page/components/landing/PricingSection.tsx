"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Building2, Crown, Zap, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individual educators exploring compliance",
    icon: Sparkles,
    features: [
      "1 Standard framework",
      "10 Evidence uploads",
      "Basic Horus AI chat",
      "Gap analysis (1 per month)",
      "Community support",
    ],
    popular: false,
    buttonText: "Start for free",
    buttonHref: "/signup",
    buttonVariant: "secondary"
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For institutions serious about accreditation",
    icon: Building2,
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
    buttonText: "Get Started",
    buttonHref: "/signup",
    buttonVariant: "primary"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large institutions and university systems",
    icon: Crown,
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
    buttonText: "Contact Sales",
    buttonHref: "mailto:hello@ayn-edu.com",
    buttonVariant: "outline"
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-transparent py-24 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold mb-6 tracking-widest uppercase"
          >
            <Zap className="w-3 h-3 mr-2 text-primary" />
            Simple Pricing
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            Scale your <span className="text-white/40">compliance.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/50 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed"
          >
            Start free. Upgrade when you need full autonomous capabilities and infinite scale.
          </motion.p>
        </div>

        {/* Plans Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-30 blur-[4px] pointer-events-none select-none grayscale-[0.3]">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                className={cn(
                  "relative flex flex-col rounded-3xl p-8 backdrop-blur-xl transition-all duration-500",
                  plan.popular 
                    ? "bg-white/[0.04] border border-white/10 shadow-[0_0_80px_rgba(37,99,235,0.1)]" 
                    : "bg-white/[0.02] border border-white/5"
                )}
              >
                {/* Animated glow on popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 rounded-3xl border border-primary/20 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                  </div>
                )}

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <plan.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/40 text-sm font-light min-h-[40px]">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-white/40 text-sm font-light ml-1">{plan.period}</span>}
                </div>

                <div
                  className={cn(
                    "w-full flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 mb-10",
                    plan.buttonVariant === "primary" && "bg-white text-black",
                    plan.buttonVariant === "secondary" && "bg-white/10 text-white",
                    plan.buttonVariant === "outline" && "border border-white/10 text-white"
                  )}
                >
                  {plan.buttonText}
                </div>

                <ul className="space-y-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14px]">
                      <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                      </div>
                      <span className="text-white/60 font-light leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative max-w-md w-full mx-6 rounded-3xl bg-[#090e18]/80 backdrop-blur-3xl border border-white/10 px-8 py-10 text-center shadow-[0_0_80px_rgba(37,99,235,0.15)]"
            >
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
                <Clock className="w-6 h-6 text-white/80" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Pricing Coming Soon</h3>
              <p className="text-white/50 mb-10 text-[15px] font-light leading-relaxed">
                We're crafting the perfect plans for every institution size. Sign up now to get early access and be the first to know when pricing launches.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
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

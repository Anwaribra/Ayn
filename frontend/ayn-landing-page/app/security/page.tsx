"use client"

import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Shield, Lock, Eye, Server, Key, RefreshCw } from "lucide-react"

const securityFeatures = [
  {
    icon: Lock,
    title: "Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Evidence documents are stored in isolated, encrypted storage buckets.",
  },
  {
    icon: Key,
    title: "Authentication",
    description: "JWT-based authentication with secure token rotation. Support for Google OAuth and role-based access controls (RBAC) across the platform.",
  },
  {
    icon: Eye,
    title: "Access Control",
    description: "Fine-grained role-based permissions ensure users only access data relevant to their institution and role. Full audit trail of all actions.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    description: "Hosted on enterprise-grade cloud infrastructure with automated backups, redundancy, and 99.9% uptime SLA.",
  },
  {
    icon: Shield,
    title: "Compliance",
    description: "Our platform is designed with data protection principles at its core. We follow industry best practices for handling sensitive educational data.",
  },
  {
    icon: RefreshCw,
    title: "Monitoring",
    description: "Continuous security monitoring, rate limiting, and automated threat detection protect against unauthorized access and abuse.",
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="glass-pill mb-4 inline-flex items-center gap-2 rounded-full border-emerald-500/20 px-3 py-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 text-[10px] uppercase tracking-[0.2em] font-bold">Security First</span>
          </div>
          <h1 className="glass-text-primary mb-4 text-4xl font-bold">Security at Ayn</h1>
          <p className="glass-text-secondary mx-auto max-w-xl text-lg">
            Your institutional data deserves the highest level of protection.
            Security is built into every layer of the Ayn platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="glass-panel rounded-2xl p-6 transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="glass-text-primary mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="glass-text-secondary text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="glass-surface-strong glass-text-primary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-3">Have Security Questions?</h2>
          <p className="glass-text-secondary mb-5 text-sm">
            We take security seriously. If you have questions or want to report a vulnerability,
            please reach out to our team.
          </p>
          <a
            href="mailto:hello@ayn-edu.com"
            className="glass-button glass-text-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
          >
            Contact Security Team
          </a>
        </div>
      </main>

      <div className="px-4 pb-4">
        <LandingFooter />
      </div>
    </div>
  )
}

"use client"

import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-24">
        <div className="glass-surface glass-text-primary rounded-3xl p-8 md:p-10">
        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="glass-text-secondary mb-10 text-sm">Last updated: March 12, 2026</p>

        <div className="glass-text-secondary space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">1. Introduction</h2>
            <p>
              Ayn Platform (&quot;Ayn&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy
              of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our AI-powered quality assurance and compliance platform.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">2. Information We Collect</h2>
            <p className="mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Account information (name, email address, password, role)</li>
              <li>Institutional information (institution name, type, accreditation details)</li>
              <li>Evidence documents and files you upload for compliance analysis</li>
              <li>Chat conversations with Horus AI</li>
              <li>Usage data and interaction logs within the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Provide, maintain, and improve the Ayn platform and Horus AI services</li>
              <li>Analyze evidence against accreditation standards (ISO 21001, NCAAA, etc.)</li>
              <li>Generate compliance reports, gap analyses, and remediation plans</li>
              <li>Personalize your experience and provide AI-driven recommendations</li>
              <li>Communicate with you about your account and platform updates</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption
              in transit and at rest, secure authentication, role-based access controls, and regular
              security audits. Your evidence documents are stored in isolated, encrypted storage.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with third-party services
              only as necessary to provide our services (e.g., AI processing, cloud storage),
              and all third-party providers are bound by strict data protection agreements.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may also request
              a copy of your data or restrict its processing. To exercise these rights, contact us at{" "}
              <a href="mailto:hello@ayn-edu.com" className="text-blue-600 hover:underline">hello@ayn-edu.com</a>.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:hello@ayn-edu.com" className="text-blue-600 hover:underline">hello@ayn-edu.com</a>.
            </p>
          </section>
        </div>
        </div>
      </main>

      <div className="px-4 pb-4">
        <LandingFooter />
      </div>
    </div>
  )
}

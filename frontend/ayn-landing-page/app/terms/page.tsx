"use client"

import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-24">
        <div className="glass-surface glass-text-primary rounded-3xl p-8 md:p-10">
        <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
        <p className="glass-text-secondary mb-10 text-sm">Last updated: March 12, 2026</p>

        <div className="glass-text-secondary space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Ayn Platform, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">2. Description of Service</h2>
            <p>
              Ayn provides an AI-powered quality assurance and compliance platform for educational
              institutions. Our services include evidence management, standards mapping, gap analysis,
              Horus AI virtual auditor, and compliance reporting.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the platform for any unlawful purpose</li>
              <li>Upload malicious files or content</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Interfere with or disrupt the platform&apos;s functionality</li>
              <li>Reverse engineer or attempt to extract source code from the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">5. Intellectual Property</h2>
            <p>
              The Ayn platform, including Horus AI, all software, designs, and content, is the
              intellectual property of Ayn. You retain ownership of all content and documents
              you upload to the platform.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">6. AI-Generated Content</h2>
            <p>
              Horus AI provides compliance analysis, gap detection, and recommendations as decision-support
              tools. AI-generated outputs should be reviewed by qualified professionals before being used
              for official accreditation submissions. Ayn does not guarantee the accuracy of AI-generated
              content.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">7. Limitation of Liability</h2>
            <p>
              Ayn shall not be liable for any indirect, incidental, special, or consequential damages
              arising from your use of the platform. Our total liability shall not exceed the amount
              paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">8. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms.
              Upon termination, you may request export of your data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="glass-text-primary mb-3 text-xl font-semibold">9. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
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

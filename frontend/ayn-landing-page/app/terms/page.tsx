"use client"

import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"

const PAGE_BG = "#f5f5f3"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold text-[#050810] mb-2">Terms of Service</h1>
        <p className="text-sm text-black/40 mb-10">Last updated: March 12, 2026</p>

        <div className="space-y-8 text-[#050810]/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Ayn Platform, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">2. Description of Service</h2>
            <p>
              Ayn provides an AI-powered quality assurance and compliance platform for educational
              institutions. Our services include evidence management, standards mapping, gap analysis,
              Horus AI virtual auditor, and compliance reporting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">4. Acceptable Use</h2>
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
            <h2 className="text-xl font-semibold text-[#050810] mb-3">5. Intellectual Property</h2>
            <p>
              The Ayn platform, including Horus AI, all software, designs, and content, is the
              intellectual property of Ayn. You retain ownership of all content and documents
              you upload to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">6. AI-Generated Content</h2>
            <p>
              Horus AI provides compliance analysis, gap detection, and recommendations as decision-support
              tools. AI-generated outputs should be reviewed by qualified professionals before being used
              for official accreditation submissions. Ayn does not guarantee the accuracy of AI-generated
              content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">7. Limitation of Liability</h2>
            <p>
              Ayn shall not be liable for any indirect, incidental, special, or consequential damages
              arising from your use of the platform. Our total liability shall not exceed the amount
              paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">8. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms.
              Upon termination, you may request export of your data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#050810] mb-3">9. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
              <a href="mailto:hello@ayn-edu.com" className="text-blue-600 hover:underline">hello@ayn-edu.com</a>.
            </p>
          </section>
        </div>
      </main>

      <div className="px-4 pb-4">
        <LandingFooter />
      </div>
    </div>
  )
}

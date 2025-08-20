import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, Users, AlertTriangle } from "lucide-react"

const TermsAndConditions = () => {
  const lastUpdated = "January 15, 2025"

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using GenWrite ('the Service'), you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These Terms of Service may be updated from time to time. We will notify you of any material changes.",
      ],
    },
    {
      title: "2. Description of Service",
      content: [
        "GenWrite is an AI-powered writing platform that provides content generation, editing, and optimization tools.",
        "The service includes but is not limited to: AI writing assistance, content templates, analytics, and collaboration features.",
        "We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.",
      ],
    },
    {
      title: "3. User Accounts and Registration",
      content: [
        "You must provide accurate and complete registration information when creating an account.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must notify us immediately of any unauthorized use of your account.",
        "One person or legal entity may not maintain more than one free account.",
      ],
    },
    {
      title: "4. Acceptable Use Policy",
      content: [
        "You may not use the service for any illegal or unauthorized purpose.",
        "You must not create content that is harmful, offensive, or violates intellectual property rights.",
        "Prohibited activities include: spamming, harassment, distributing malware, or attempting to breach security.",
        "We reserve the right to suspend or terminate accounts that violate these policies.",
      ],
    },
    {
      title: "5. Intellectual Property Rights",
      content: [
        "Content you create using our service remains your intellectual property.",
        "You grant us a limited license to process and store your content to provide the service.",
        "Our AI models, software, and platform technology remain our intellectual property.",
        "You may not reverse engineer, copy, or create derivative works of our technology.",
      ],
    },
    {
      title: "6. Payment and Billing",
      content: [
        "Paid subscriptions are billed in advance on a monthly or annual basis.",
        "All fees are non-refundable except as required by law or as specified in our refund policy.",
        "We may change our pricing with 30 days' notice to existing subscribers.",
        "Failure to pay may result in service suspension or account termination.",
      ],
    },
    {
      title: "7. Data and Privacy",
      content: [
        "We collect and process your data in accordance with our Privacy Policy.",
        "You retain ownership of your content and data.",
        "We implement industry-standard security measures to protect your information.",
        "You may request data export or deletion in accordance with applicable laws.",
      ],
    },
    {
      title: "8. Service Availability",
      content: [
        "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service.",
        "Scheduled maintenance will be announced in advance when possible.",
        "We are not liable for service interruptions beyond our reasonable control.",
        "Service level agreements may apply to Enterprise customers.",
      ],
    },
    {
      title: "9. Limitation of Liability",
      content: [
        "Our liability is limited to the amount you paid for the service in the 12 months preceding the claim.",
        "We are not liable for indirect, incidental, or consequential damages.",
        "Some jurisdictions do not allow limitation of liability, so these limits may not apply to you.",
        "You agree to indemnify us against claims arising from your use of the service.",
      ],
    },
    {
      title: "10. Termination",
      content: [
        "You may terminate your account at any time through your account settings.",
        "We may terminate accounts for violation of these terms or for any reason with notice.",
        "Upon termination, your right to use the service ceases immediately.",
        "Data retention and deletion policies are outlined in our Privacy Policy.",
      ],
    },
    {
      title: "11. Governing Law",
      content: [
        "These terms are governed by the laws of the State of California, United States.",
        "Any disputes will be resolved through binding arbitration in San Francisco, CA.",
        "You waive any right to participate in class action lawsuits.",
        "If any provision is found unenforceable, the remainder of these terms remain in effect.",
      ],
    },
    {
      title: "12. Contact Information",
      content: [
        "For questions about these Terms of Service, contact us at genwrite.co@gmail.com.",
        "For general support inquiries, use support@genwrite.com.",
        "Mailing address: GenWrite Technologies, 123 Innovation Drive, Suite 400, San Francisco, CA 94105",
        "We will respond to legal inquiries within 5 business days.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src="/Images/logo_genwrite_2.png" alt="GenWrite Logo" class="w-40 h-auto" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-10">Terms and Conditions</h1>
        {/* Introduction */}
        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">
            These Terms and Conditions govern your use of the GenWrite platform and
            services. Please read them carefully as they contain important information about your
            rights and obligations.
          </p>
          <p className="text-gray-600 mt-2 text-sm">Last Updated: {lastUpdated}</p>
        </section>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section key={index}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              <ul className="list-disc pl-5 space-y-2">
                {section.content.map((paragraph, pIndex) => (
                  <li key={pIndex} className="text-gray-600">
                    {paragraph}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Important Notice */}
        <section className="mt-8">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
              <p className="text-gray-600">
                By creating an account or using our services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions. If you do not agree
                with any part of these terms, you must not use our service.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions About These Terms?</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have any questions about these Terms and Conditions, please don't hesitate to
            contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:genwrite.co@gmail.com"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
              aria-label="Contact legal team via email"
            >
              <Mail className="w-4 h-4" />
              genwrite.co@gmail.com
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
              aria-label="Visit contact support page"
            >
              <Users className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default TermsAndConditions

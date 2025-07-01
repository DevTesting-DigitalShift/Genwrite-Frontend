import React from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Shield,
  FileText,
  Calendar,
  Mail,
  AlertTriangle,
  Users,
  Globe,
} from "lucide-react"

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
        "For questions about these Terms of Service, contact us at legal@genwrite.com.",
        "For general support inquiries, use support@genwrite.com.",
        "Mailing address: GenWrite Technologies, 123 Innovation Drive, Suite 400, San Francisco, CA 94105",
        "We will respond to legal inquiries within 5 business days.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Signup
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GenWrite</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms and Conditions ("Terms") govern your use of the GenWrite platform and
                services. Please read them carefully as they contain important information about
                your rights and obligations.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Last Updated</div>
                <div className="text-gray-600 text-sm">{lastUpdated}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Applies To</div>
                <div className="text-gray-600 text-sm">All Users</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Globe className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Jurisdiction</div>
                <div className="text-gray-600 text-sm">California, USA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
                  {index + 1}
                </div>
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                By creating an account or using our services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions. If you do not agree
                with any part of these terms, you must not use our service.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Questions About These Terms?</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms and Conditions, please don't hesitate to
              contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:legal@genwrite.com"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                legal@genwrite.com
              </a>
              <Link
                to="/contact"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions

import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Shield,
  Lock,
  Calendar,
  Mail,
  Eye,
  Database,
  Users,
  Globe,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
} from "lucide-react"

const PrivacyPolicy = () => {
  const lastUpdated = "January 15, 2025"

  const sections = [
    {
      title: "1. Information We Collect",
      icon: <Database className="w-5 h-5" />,
      content: [
        "Account Information: Name, email address, password, and profile information you provide when creating an account.",
        "Content Data: Text, documents, and other content you create, upload, or generate using our AI writing tools.",
        "Usage Data: Information about how you use our service, including features accessed, time spent, and interaction patterns.",
        "Technical Data: Browser type, device information, operating system, and other technical identifiers.",
        "Communication Data: Messages you send to our support team or through our platform's communication features.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      icon: <Settings className="w-5 h-5" />,
      content: [
        "Service Provision: To provide, maintain, and improve our AI writing platform and related services.",
        "Personalization: To customize your experience and provide relevant content suggestions and recommendations.",
        "Communication: To send you service updates, security alerts, and respond to your inquiries.",
        "Analytics: To understand usage patterns and improve our service performance and user experience.",
        "Legal Compliance: To comply with legal obligations and protect our rights and the rights of our users.",
      ],
    },
    {
      title: "3. Information Sharing and Disclosure",
      icon: <Users className="w-5 h-5" />,
      content: [
        "We do not sell, trade, or rent your personal information to third parties for marketing purposes.",
        "Service Providers: We may share data with trusted third-party service providers who assist in operating our platform.",
        "Legal Requirements: We may disclose information when required by law or to protect our rights and safety.",
        "Business Transfers: In the event of a merger or acquisition, user information may be transferred to the new entity.",
        "Consent: We may share information with your explicit consent for specific purposes.",
      ],
    },
    {
      title: "4. Data Security and Protection",
      icon: <Lock className="w-5 h-5" />,
      content: [
        "Encryption: All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
        "Access Controls: Strict access controls ensure only authorized personnel can access user data.",
        "Regular Audits: We conduct regular security audits and vulnerability assessments.",
        "Incident Response: We have procedures in place to respond quickly to any security incidents.",
        "Compliance: We maintain compliance with industry standards including SOC 2 Type II and GDPR.",
      ],
    },
    {
      title: "5. Your Privacy Rights",
      icon: <CheckCircle className="w-5 h-5" />,
      content: [
        "Access: You can request access to the personal information we hold about you.",
        "Correction: You can update or correct your personal information through your account settings.",
        "Deletion: You can request deletion of your account and associated data (subject to legal requirements).",
        "Portability: You can request a copy of your data in a machine-readable format.",
        "Opt-out: You can opt out of non-essential communications and certain data processing activities.",
      ],
    },
    {
      title: "6. Cookies and Tracking Technologies",
      icon: <Eye className="w-5 h-5" />,
      content: [
        "Essential Cookies: Required for basic functionality like authentication and security.",
        "Analytics Cookies: Help us understand how users interact with our platform to improve the experience.",
        "Preference Cookies: Remember your settings and preferences for a personalized experience.",
        "Third-party Cookies: Some features may use third-party services that set their own cookies.",
        "Cookie Control: You can manage cookie preferences through your browser settings.",
      ],
    },
    {
      title: "7. AI and Machine Learning",
      icon: <Database className="w-5 h-5" />,
      content: [
        "Model Training: We may use aggregated, anonymized data to improve our AI models and services.",
        "Content Processing: Your content is processed by our AI systems to provide writing assistance and suggestions.",
        "Data Isolation: Your personal content is not used to train models that serve other users.",
        "Opt-out Options: You can opt out of having your data used for model improvement purposes.",
        "Transparency: We provide clear information about how AI processes your data.",
      ],
    },
    {
      title: "8. International Data Transfers",
      icon: <Globe className="w-5 h-5" />,
      content: [
        "Global Service: Our service is provided globally, which may require transferring data across borders.",
        "Adequate Protection: We ensure adequate protection for international data transfers through appropriate safeguards.",
        "Standard Contractual Clauses: We use Standard Contractual Clauses approved by relevant authorities.",
        "Data Localization: Where required by law, we maintain data within specific geographic regions.",
        "User Control: You can request information about where your data is stored and processed.",
      ],
    },
    {
      title: "9. Data Retention",
      icon: <Calendar className="w-5 h-5" />,
      content: [
        "Account Data: Retained for as long as your account is active or as needed to provide services.",
        "Content Data: Retained according to your subscription plan and deletion requests.",
        "Usage Data: Typically retained for 2 years for analytics and service improvement purposes.",
        "Legal Requirements: Some data may be retained longer to comply with legal obligations.",
        "Deletion Process: We have automated processes to delete data according to our retention policies.",
      ],
    },
    {
      title: "10. Children's Privacy",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "Age Requirement: Our service is not intended for children under 13 years of age.",
        "No Collection: We do not knowingly collect personal information from children under 13.",
        "Parental Rights: Parents can request deletion of their child's information if collected inadvertently.",
        "Verification: We may implement age verification measures to ensure compliance.",
        "Educational Use: Special provisions may apply for educational institutions using our service.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                aria-label="Back to signup page"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Signup
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Your Privacy Matters</h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                At GenWrite, we are committed to protecting your privacy and ensuring the security
                of your personal information. This Privacy Policy explains how we collect, use, and
                safeguard your data when you use our AI writing platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: <Calendar className="w-5 h-5 text-blue-600" />, title: "Last Updated", value: lastUpdated },
              { icon: <Shield className="w-5 h-5 text-green-600" />, title: "GDPR Compliant", value: "Full Compliance" },
              { icon: <Lock className="w-5 h-5 text-purple-600" />, title: "Encryption", value: "AES-256" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200"
              >
                {item.icon}
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</div>
                  <div className="text-gray-600 text-sm">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Principles */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 sm:p-8 mb-10 border border-blue-200 shadow-md">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            Our Privacy Principles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Transparency in data collection",
              "Minimal data collection",
              "User control over data",
              "Strong security measures",
              "No data selling",
              "Regular policy updates",
            ].map((principle, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-700 font-medium text-base">{principle}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={index}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 transition-all duration-200 hover:shadow-xl"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {section.icon}
                </div>
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <div key={pIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 leading-relaxed text-base">{paragraph}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Data Rights Section */}
        <section className="bg-blue-50 border border-blue-200 rounded-3xl p-6 sm:p-8 mt-10 shadow-md">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Exercise Your Data Rights</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                You have the right to access, correct, delete, or export your personal data. Contact
                us to exercise any of these rights or if you have questions about our privacy
                practices.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:privacy@genwrite.com"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Contact privacy team via email"
            >
              <Mail className="w-4 h-4" />
              privacy@genwrite.com
            </a>
            <Link
              to="/contact"
              className="border border-blue-300 text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Visit contact support page"
            >
              <Users className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </section>

        {/* Important Notice */}
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mt-8 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 text-lg">Policy Updates</h3>
              <p className="text-amber-800 text-base leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by email or through our platform. Your continued use of our service
                after such changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PrivacyPolicy
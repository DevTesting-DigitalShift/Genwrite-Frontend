import { useState } from "react"
import emailjs from "emailjs-com"
import {
  Mail,
  Clock,
  Send,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  User,
  MessageSquare,
  Building2,
  ArrowRight,
  Sparkles,
  Youtube,
} from "lucide-react"
import { message } from "antd"
import { Helmet } from "react-helmet"
import { motion, AnimatePresence } from "framer-motion"

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long"
    }

    return newErrors
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formData,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      message.success("Message sent successfully!")
      setFormData({ name: "", email: "", subject: "", message: "" })
      setIsSubmitted(true)
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      console.error("FAILED...", error)
      message.error("Failed to send message. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const companyInfo = {
    name: "GenWrite Technologies",
    address: {
      street: "123 Innovation Drive",
      suite: "Suite 400",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    phone: "+1 (555) 123-4567",
    email: " support@genwrite.co",
    workingHours: {
      weekdays: "Monday - Friday: 9:00 AM - 6:00 PM PST",
      weekend: "Saturday - Sunday: Closed",
    },
  }

  const socialLinks = [
    {
      name: "Youtube",
      icon: Youtube,
      url: "https://www.youtube.com/@genwrite",
      color: "hover:text-red-600",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/genwrite_ai",
      color: "hover:text-pink-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/genwrite",
      color: "hover:text-blue-400",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://www.linkedin.com/in/genwrite/",
      color: "hover:text-blue-700",
    },
  ]

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Contact Us | GenWrite</title>
      </Helmet>

      {/* Hero Section */}
      <div className="pt-8 md:pt-12 py-12 md:py-16 lg:py-20 px-4">
        <div className="max-w-7xl mx-auto text-center mt-6 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-blue-800 mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            We'd Love to Hear From You
          </motion.div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about our AI writing platform? Need support? Want to explore enterprise
            solutions?{" "}
            <span className="text-blue-600 font-medium">We're here to help you succeed.</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

              <div className="relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      Send us a Message
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base font-medium">
                      We'll get back to you within 24 hours
                    </p>
                  </div>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3 overflow-hidden"
                    >
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-green-800">Message Sent Successfully!</h3>
                        <p className="text-green-700 text-sm">
                          Thank you for contacting us. We'll respond within 24 hours.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:shadow-sm outline-none transition-all duration-300 ${
                            errors.name
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-50 focus:border-blue-500"
                          }`}
                          placeholder="Your full name"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs font-semibold text-red-500 ml-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:shadow-sm outline-none transition-all duration-300 ${
                            errors.email
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-50 focus:border-blue-500"
                          }`}
                          placeholder="you@example.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs font-semibold text-red-500 ml-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-bold text-gray-700 ml-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:shadow-sm outline-none transition-all duration-300"
                      placeholder="What is this about? (optional)"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-bold text-gray-700 ml-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:shadow-sm outline-none transition-all duration-300 resize-none ${
                        errors.message
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-50 focus:border-blue-500"
                      }`}
                      placeholder="Tell us how we can help you..."
                    />
                    {errors.message && (
                      <p className="text-xs font-semibold text-red-500 ml-1">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-5 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl transition-all duration-300 shadow shadow-blue-100 hover:shadow flex items-center justify-center gap-3 border-none group ${
                      isSubmitting
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:scale-[1.01] active:scale-[0.99]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Info Side Panel */}
          <div className="space-y-6 sm:space-y-8">
            {/* Contact Info Card */}
            <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
              </div>

              <div className="space-y-8 text-left">
                {/* Email */}
                <div className="group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Support Email
                  </p>
                  <a
                    href={`mailto:${companyInfo.email.trim()}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-2xl transition-all"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-none">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-blue-600 truncate">
                      {companyInfo.email.trim()}
                    </span>
                  </a>
                </div>

                {/* Working Hours */}
                <div className="group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Working Hours
                  </p>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 border border-transparent group-hover:border-orange-100 rounded-2xl transition-all">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-600 space-y-1">
                      <p>{companyInfo.workingHours.weekdays}</p>
                      <p>{companyInfo.workingHours.weekend}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Card */}
            <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Follow Us</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {socialLinks.map(social => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow border border-transparent hover:border-gray-100 group`}
                    >
                      <Icon className={`w-6 h-6 text-gray-400 transition-colors ${social.color}`} />
                      <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-tighter sm:tracking-normal">
                        {social.name}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Feedback Widget */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow shadow-indigo-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-200" />
                  <h3 className="text-xl font-bold">Feedback</h3>
                </div>
                <p className="text-indigo-100 text-xs sm:text-sm mb-6 leading-relaxed">
                  Your insights power our growth. Help us shape the future of GenWrite.
                </p>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScIdA2aVtugx-zMGON8LJKD4IRWtLZqiiurw-jU6wRYfOv7EA/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 bg-white text-indigo-600 font-bold rounded-2xl shadow hover:bg-indigo-50 transition-all border-none"
                >
                  Join the Survey
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs

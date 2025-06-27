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
} from "lucide-react"
import { message } from "antd"

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formData,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error) {
      console.error("FAILED...", error)
      message.error("Failed to send message. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // using node mailer
  //   const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   const newErrors = validateForm()
  //   if (Object.keys(newErrors).length > 0) {
  //     setErrors(newErrors)
  //     return
  //   }

  //   setIsSubmitting(true)

  //   try {
  //     const response = await fetch("http://localhost:5000/api/send-email", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(formData),
  //     })

  //     const data = await response.json()
  //     if (data.success) {
  //       setFormData({ name: "", email: "", subject: "", message: "" })
  //       message.success("Message sent successfully!")
  //     } else {
  //       throw new Error(data.message)
  //     }
  //   } catch (error) {
  //     console.error("FAILED...", error)
  //     message.error("Failed to send message. Try again.")
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

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
    email: "hello@genwrite.com",
    workingHours: {
      weekdays: "Monday - Friday: 9:00 AM - 6:00 PM PST",
      weekend: "Saturday - Sunday: Closed",
    },
  }

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://facebook.com/genwrite",
      color: "hover:text-blue-600",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/genwrite",
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
      url: "https://linkedin.com/company/genwrite",
      color: "hover:text-blue-700",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section */}
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium text-blue-800 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            We'd Love to Hear From You
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about our AI writing platform? Need support? Want to explore enterprise
            solutions?{" "}
            <span className="text-blue-600 font-medium">We're here to help you succeed.</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Send us a Message</h2>
                    <p className="text-gray-600">We'll get back to you within 24 hours</p>
                  </div>
                </div>

                {/* Success Message */}
                {isSubmitted && (
                  <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-800">Message Sent Successfully!</h3>
                      <p className="text-green-700 text-sm">
                        Thank you for contacting us. We'll respond within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-1 gap-6">
                    {/* Name Field */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Full Name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300 ${
                            errors.name
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Email Address <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300 ${
                            errors.email
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="Enter your email address"
                        />
                      </div>
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300"
                      placeholder="What's this about? (optional)"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Message <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300 resize-none ${
                        errors.message
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Tell us how we can help you..."
                    />
                    {errors.message && (
                      <p className="mt-2 text-sm text-red-600">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                      isSubmitting
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Company Information & Map */}
          <div className="space-y-8">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Visit Us</h3>
              </div>

              <div className="space-y-6">
                {/* Address */}
                {/* <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      <p className="font-medium">{companyInfo.name}</p>
                      <p>{companyInfo.address.street}</p>
                      <p>{companyInfo.address.suite}</p>
                      <p>
                        {companyInfo.address.city}, {companyInfo.address.state}{" "}
                        {companyInfo.address.zip}
                      </p>
                      <p>{companyInfo.address.country}</p>
                    </div>
                  </div>
                </div> */}

                {/* Phone */}
                {/* <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                    <a
                      href={`tel:${companyInfo.phone}`}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {companyInfo.phone}
                    </a>
                  </div>
                </div> */}

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                    <a
                      href={`mailto:${companyInfo.email}`}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {companyInfo.email}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Working Hours</h4>
                    <div className="text-gray-600 text-sm">
                      <p>{companyInfo.workingHours.weekdays}</p>
                      <p>{companyInfo.workingHours.weekend}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Follow Us</h3>
              </div>

              <p className="text-gray-600 mb-6">Stay connected and get the latest updates</p>

              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-md ${social.color}`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="font-medium text-gray-700">{social.name}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-10">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Find Us</h3>
            </div>
          </div>
          <div className="h-96 bg-gray-100 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0197327113716!2d-122.39492668468141!3d37.78808797975647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085807cf8b8b5b5%3A0x8b8b8b8b8b8b8b8b!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1635959999999!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-b-2xl"
            />
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default ContactUs

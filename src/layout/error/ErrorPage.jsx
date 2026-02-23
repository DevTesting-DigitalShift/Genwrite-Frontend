import React from "react"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { ArrowLeft, HelpCircle, Home } from "lucide-react"

const ErrorPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>404 - Page Not Found | GenWrite</title>
        <meta
          name="description"
          content="The page you are looking for could not be found. Return to the dashboard or contact support for assistance."
        />
      </Helmet>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-linear-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-linear-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <img src="/Images/logo_genwrite_2.webp" alt="GenWrite Logo" className="w-40 h-auto" />
      </motion.div>

      {/* Main Content */}
      <main className="grid min-h-screen place-items-center px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-12 max-w-lg w-full text-center relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-linear-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

          {/* Error Graphic */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="mb-6"
          >
            <span className="text-6xl sm:text-8xl font-bold text-red-500 drop-shadow-md">404</span>
          </motion.div>

          {/* Error Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8" aria-live="polite">
            Sorry, we couldn’t find the page you’re looking for.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 w-full sm:w-auto"
              aria-label="Go back to dashboard"
            >
              <Home className="w-5 h-5" />
              Go Back Home
            </motion.a>
            <motion.button
              onClick={() => history.back()}
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-300 w-full sm:w-auto"
              aria-label="Return to previous page"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous Page
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default ErrorPage

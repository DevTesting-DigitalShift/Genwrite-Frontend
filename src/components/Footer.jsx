import React from "react"

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-300 py-6 px-4 text-sm text-gray-700 relative">
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        {/* Copyright */}
        <p className="text-center sm:text-left mb-2 sm:mb-0">
          &copy; {new Date().getFullYear()} <strong>GenWrite</strong>. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 text-blue-500">
          <a
            href="/terms-and-conditions"
            target="_blank"
            className="transition hover:text-blue-700 hover:underline"
          >
            Terms of Service
          </a>
          <span className="hidden sm:inline text-gray-400">|</span>
          <a
            href="/privacy-policy"
            target="_blank"
            className="transition hover:text-blue-700 hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

import React from "react"

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-300 py-6 px-4 text-sm  relative">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Copyright */}
        <p className="text-center sm:text-left">
          &copy; {new Date().getFullYear()} <strong>GenWrite</strong>. All rights reserved.
        </p>

        {/* Badge */}
        <a href="https://dang.ai" target="_blank" rel="dofollow noopener" style={{ display: "inline-block", textDecoration: "none" }}>
          <img src="https://assets.dang.ai/badges/dang-verified-dark.png" alt="Verified on DANG!" width="160" height="54" style={{ display: "block", width: "100px", maxWidth: "100%", height: "34px", border: "0", outline: "none", textDecoration: "none" }} />
        </a>

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

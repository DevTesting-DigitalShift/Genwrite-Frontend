import { Suspense, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/UI/LoadingScreen"
import { message } from "antd"

const App = () => {
  // Show desktop warning on mobile devices
  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")
    if (window.innerWidth < 1024 && !hasShown) {
      message.warning("For the best experience, please use desktop view.", 5)
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>
      <Outlet />
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
    </Suspense>
  )
}

export default App

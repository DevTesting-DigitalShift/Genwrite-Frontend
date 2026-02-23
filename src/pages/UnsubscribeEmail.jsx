import React, { useEffect } from "react"
import { MailMinus, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import useAuthStore from "@store/useAuthStore"
import toast from "@utils/toast"

const UnsubscribeEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, unsubscribeSuccessMessage, error, unsubscribeAction, resetUnsubscribe } =
    useAuthStore()

  // Get email from URL query parameter
  const email = searchParams.get("email")

  // Reset unsubscribe state when component unmounts
  useEffect(() => {
    return () => {
      resetUnsubscribe()
    }
  }, [resetUnsubscribe])

  // Handle success or error messages
  useEffect(() => {
    if (unsubscribeSuccessMessage) {
      toast.success(unsubscribeSuccessMessage)
      // Redirect to home after 2 seconds
      setTimeout(() => navigate("/"), 2000)
    }
    if (error) {
      toast.error(error)
    }
  }, [unsubscribeSuccessMessage, error, navigate])

  // Validate email format
  const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email && emailRegex.test(email)
  }

  const handleUnsubscribe = async () => {
    if (!email) {
      toast.error("Email not provided in the URL. Please check the link and try again.")
      return
    }
    if (!isValidEmail(email)) {
      toast.error("Invalid email format. Please provide a valid email address.")
      return
    }
    try {
      await unsubscribeAction(email)
    } catch (err) {
      // Error is handled by useEffect
    }
  }

  const handleStaySubscribed = () => {
    navigate("/dashboard") // Redirect to dashboard
  }

  return (
    <main className="bg-linear-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center min-h-screen p-4 font-sans">
      <div className="max-w-xl w-full bg-white/40 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/20 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-purple-200 blur-3xl opacity-30 rounded-full scale-150"></div>
          <div className="relative bg-linear-to-br from-purple-500 to-indigo-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-purple-200 rotate-3 hover:rotate-0 transition-transform duration-300">
            <MailMinus className="h-12 w-12 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
          We’re sad to see you go <span className="inline-block animate-bounce">😔</span>
        </h1>

        <p className="text-gray-500 mb-12 text-lg sm:text-xl font-medium">
          You’re about to unsubscribe from our emails. Are you sure you want to miss out on our
          latest updates?
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStaySubscribed}
            disabled={loading}
            className="btn btn-primary btn-lg w-full sm:w-auto rounded-2xl font-semibold text-lg bg-linear-to-r from-purple-600 to-indigo-600 border-none text-white shadow-xl shadow-purple-200 hover:scale-[1.05] transition-all normal-case h-16 min-w-[200px]"
          >
            Stay Subscribed
          </button>
          <button
            onClick={handleUnsubscribe}
            disabled={loading || !email || !isValidEmail(email)}
            className="btn btn-ghost btn-lg w-full sm:w-auto rounded-2xl font-semibold text-lg text-purple-800 hover:bg-purple-100/50 normal-case h-16 min-w-[180px]"
          >
            {loading ? <span className="loading loading-spinner"></span> : "Unsubscribe"}
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-400">
            Changed your mind? You can resubscribe anytime from your account settings.
          </p>
        </div>
      </div>
    </main>
  )
}

export default UnsubscribeEmail

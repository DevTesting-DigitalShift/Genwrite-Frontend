import React, { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { useVerifyEmail } from "@/api/queries/authQueries"
import useVerificationStore from "@store/useVerificationStore"

const VerifiedEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")
  const hasVerified = useRef(false)
  const { mutate: verifyEmail, isPending, isError, error, isSuccess, data } = useVerifyEmail()

  const [errorMessage, setErrorMessage] = useState("")

  // Update error message when mutation fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Verification failed")
    }
  }, [error])

  // Update error message if success = false in data
  useEffect(() => {
    if (data && !data.success) {
      setErrorMessage(data.message || "Verification failed")
    }
  }, [data])

  // 🔥 VERIFY EMAIL USING TOKEN — runs exactly once
  useEffect(() => {
    if (!token || hasVerified.current || isPending) return

    hasVerified.current = true
    verifyEmail({ token }, { onError: err => console.error("Verification error:", err) })
  }, [token, isPending, verifyEmail])

  // Clear verification state on successful verification
  useEffect(() => {
    if (isSuccess && data?.success) {
      useVerificationStore.getState().clearVerificationState()
    }
  }, [isSuccess, data])

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-3xl p-12 text-center text-slate-800">
          <AlertCircle className="size-16 text-rose-600 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">Invalid Link</h1>
          <p className="text-gray-500 mb-8">No verification token found in the URL.</p>
          <button
            onClick={() => navigate("/")}
            className="btn bg-slate-900 hover:bg-slate-800 text-white w-full rounded-2xl h-14 font-bold border-none transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="size-5 mr-2 inline" /> Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white shadow rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500 text-slate-800">
        <div className="p-8 sm:p-12">
          {/* ⏳ LOADING STATE */}
          {isPending && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="bg-blue-50 p-6 rounded-full animate-pulse mb-6">
                <Loader2 className="size-12 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Verifying your email...
              </h1>
              <p className="text-gray-500 font-medium">Please wait while we secure your account.</p>
            </div>
          )}

          {/* ✅ SUCCESS STATE */}
          {isSuccess && data?.success && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-emerald-50 p-6 rounded-full mb-8 animate-in bounce-in duration-700">
                <CheckCircle className="size-16 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                Email Verified! 🎉
              </h1>
              <p className="text-gray-500 font-medium text-lg mb-10 max-w-xs mx-auto">
                Your account is now active. You can start using all features.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="group w-full h-14 bg-[#3B4BB8] border-none hover:bg-[#3B4BB8]/90 text-white rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* ❌ ERROR STATE */}
          {(isError || (isSuccess && !data?.success) || (!token && !isPending)) && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 p-6 rounded-full mb-8 animate-in shake duration-500">
                <AlertCircle className="size-16 text-rose-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                Verification Failed
              </h1>
              <p className="text-gray-500 font-medium text-lg mb-10 max-w-xs mx-auto">
                {errorMessage ||
                  "We couldn't verify your email. The link might be expired or invalid."}
              </p>
              <div className="flex flex-col w-full gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-ghost btn-lg w-full rounded-2xl font-black text-gray-400 hover:text-gray-600 normal-case"
                >
                  <ArrowLeft className="size-5 mr-2" /> Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifiedEmail

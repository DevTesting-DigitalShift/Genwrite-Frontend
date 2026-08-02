import { Eye, EyeOff } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"
import { adminEnableMFA, adminLogin, adminSetupMFA, adminVerify2FA } from "../api/authApi"
import {
  getTempToken,
  getTempTokenRemainingTime,
  isAuthenticated,
  removeTempToken,
  setAuthToken,
  setCurrentUser,
  setTempToken,
} from "@admin/auth/authToken"

type LoginStep = "credentials" | "mfa-setup" | "otp-verify"

interface MFASetupData {
  secret: string
  qrCode: string
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || fallback
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function TokenTimer({ remainingTime }: { remainingTime: number }) {
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const isLow = remainingTime < 60

  return (
    <div className={`text-sm ${isLow ? "text-red-600" : "text-gray-500"}`}>
      Session expires in: {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: LoginStep }) {
  const steps = [
    { key: "credentials", label: "Login" },
    { key: "verify", label: "Verify" },
  ]
  const isVerifyStep = currentStep === "mfa-setup" || currentStep === "otp-verify"

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
              (step.key === "credentials" && currentStep === "credentials") ||
              (step.key === "verify" && isVerifyStep)
                ? "bg-blue-600 text-white"
                : currentStep !== "credentials" && step.key === "credentials"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {currentStep !== "credentials" && step.key === "credentials" ? "✓" : index + 1}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              (step.key === "credentials" && currentStep === "credentials") ||
              (step.key === "verify" && isVerifyStep)
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-4 ${currentStep !== "credentials" ? "bg-green-500" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function OTPInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value
    if (!/^\d*$/.test(newValue)) return

    const otpArray = value.split("")
    otpArray[index] = newValue.slice(-1)
    const newOtp = otpArray.join("")
    onChange(newOtp.padEnd(6, "").slice(0, 6))

    if (newValue && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pastedData.padEnd(6, ""))
  }

  return (
    <div className="flex justify-center space-x-3">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={`otp-slot-${index}`}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  )
}

export default function AdminLogin() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<LoginStep>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mfaSetup, setMfaSetup] = useState<MFASetupData | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin/dashboard", { replace: true })
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const response = await adminLogin(email, password)

      if (response.accessToken && response.user) {
        setAuthToken(response.accessToken)
        setCurrentUser(response.user)
        navigate("/admin/dashboard")
        return
      }

      setTempToken(response.tempToken as string)
      setRemainingTime(getTempTokenRemainingTime())

      if (response.mfaEnabled) {
        setCurrentStep("otp-verify")
      } else {
        const setupData = await adminSetupMFA(response.tempToken as string)
        setMfaSetup(setupData)
        setCurrentStep("mfa-setup")
      }
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please check your credentials."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    const tempToken = getTempToken()
    if (!tempToken || !mfaSetup) {
      setError("Session expired. Please login again.")
      setCurrentStep("credentials")
      return
    }

    setIsLoading(true)
    try {
      await adminEnableMFA(tempToken, mfaSetup.secret, otp)
      removeTempToken()
      setOtp("")
      setCurrentStep("credentials")
      setError("")
      alert("MFA enabled successfully! Please login again with your authenticator code.")
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    const tempToken = getTempToken()
    if (!tempToken) {
      setError("Session expired. Please login again.")
      setCurrentStep("credentials")
      return
    }

    setIsLoading(true)
    try {
      const response = await adminVerify2FA(tempToken, otp)
      setAuthToken(response.accessToken)
      setCurrentUser(response.user)
      removeTempToken()
      navigate("/admin/dashboard")
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = useCallback(() => {
    removeTempToken()
    setCurrentStep("credentials")
    setOtp("")
    setMfaSetup(null)
    setError("")
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Helmet>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GenWrite Admin</h1>
          <p className="text-gray-600">
            {currentStep === "credentials" && "Sign in to access the admin panel"}
            {currentStep === "mfa-setup" && "Set up two-factor authentication"}
            {currentStep === "otp-verify" && "Enter your verification code"}
          </p>
        </div>

        {currentStep !== "credentials" && <StepIndicator currentStep={currentStep} />}

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {currentStep !== "credentials" && remainingTime > 0 && (
            <div className="mb-4 text-center">
              <TokenTimer remainingTime={remainingTime} />
            </div>
          )}

          {currentStep === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@genwrite.co"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {currentStep === "mfa-setup" && mfaSetup && (
            <form onSubmit={handleMfaSetup} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div className="flex justify-center mb-4">
                  <img
                    src={mfaSetup.qrCode}
                    alt="MFA QR Code"
                    className="w-48 h-48 border border-gray-200 rounded-lg"
                  />
                </div>

                <details className="text-sm text-gray-500 mb-6">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Can&apos;t scan? Enter code manually
                  </summary>
                  <code className="block mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                    {mfaSetup.secret}
                  </code>
                </details>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-3 text-center"
                  htmlFor="otp-0"
                >
                  Enter the 6-digit code from your app
                </label>
                <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
                    Verifying...
                  </span>
                ) : (
                  "Enable MFA"
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 px-4 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {currentStep === "otp-verify" && (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & Login"
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 px-4 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} GenWrite. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

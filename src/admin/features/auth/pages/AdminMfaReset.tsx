import { ArrowLeft, CheckCircle, Key, Mail, Shield } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import {
  adminCompleteMfaReset,
  adminRequestMfaReset,
  adminVerifyMfaResetCode,
} from "../api/authApi"

type Step = "request" | "verify" | "setup" | "complete"

function getErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || fallback
}

export default function AdminMfaReset() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [secret, setSecret] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await adminRequestMfaReset(email)
      setSuccess(response.message)
      setStep("verify")
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reset code"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await adminVerifyMfaResetCode(email, code)
      setResetToken(response.resetToken)
      setSuccess(response.message)
      setStep("setup")
    } catch (err) {
      setError(getErrorMessage(err, "Invalid reset code"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await adminCompleteMfaReset(resetToken, secret, otp)
      setSuccess(response.message)
      setStep("complete")
    } catch (err) {
      setError(getErrorMessage(err, "Failed to complete MFA reset"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Helmet>
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/admin/login")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset MFA</h1>
            <p className="text-gray-600">
              {step === "request" && "Enter your email to receive a reset code"}
              {step === "verify" && "Enter the code sent to your email"}
              {step === "setup" && "Set up your new MFA authentication"}
              {step === "complete" && "MFA reset successful!"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && step !== "complete" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <Label htmlFor="code" className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4" />
                  Reset Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-gray-500 mt-2">Check your email for the reset code</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Didn&apos;t receive code? Request again
              </button>
            </form>
          )}

          {step === "setup" && (
            <form onSubmit={handleCompleteReset} className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app
                </p>
                <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                  <Shield className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Or enter this secret manually: <br />
                  <code className="bg-white px-2 py-1 rounded mt-1 inline-block">
                    {secret || "SECRET_KEY_HERE"}
                  </code>
                </p>
              </div>

              <div>
                <Label htmlFor="secret" className="mb-2">
                  Secret Key (from your authenticator)
                </Label>
                <Input
                  id="secret"
                  type="text"
                  value={secret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecret(e.target.value)}
                  placeholder="Enter secret key"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="otp" className="mb-2">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Completing..." : "Complete Reset"}
              </Button>
            </form>
          )}

          {step === "complete" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">MFA Reset Successful!</h2>
                <p className="text-gray-600">
                  Your multi-factor authentication has been reset. You can now log in with your new
                  MFA setup.
                </p>
              </div>

              <Button onClick={() => navigate("/admin/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact your system administrator
        </p>
      </div>
    </div>
  )
}

import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@components/ui/button"
import useAdminAuthStore from "@admin/auth/adminAuthStore"

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || fallback
}

export default function AdminElevate() {
  const [searchParams] = useSearchParams()
  const consumeWriteAccess = useAdminAuthStore((s) => s.consumeWriteAccess)

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    // Scrub the token from the URL bar/history immediately — it's single-purpose
    // and there's no reason for it to linger in browser history or get resent
    // as a query string on subsequent navigations from this page.
    window.history.replaceState(null, "", "/admin/elevate")

    if (!token) {
      setStatus("error")
      setMessage("Missing elevation token.")
      return
    }

    consumeWriteAccess(token)
      .then((msg) => {
        setStatus("success")
        setMessage(msg)
      })
      .catch((err) => {
        setStatus("error")
        setMessage(getErrorMessage(err, "This link is invalid or has expired."))
      })
    // biome-ignore lint/correctness/useExhaustiveDependencies: consume runs once per mount for the token in the URL
  }, [searchParams])

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <Helmet>
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      {status === "loading" && <p className="text-gray-600">Enabling write access…</p>}

      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <p className="text-gray-900 font-medium">{message}</p>
          <Button asChild>
            <Link to="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <p className="text-gray-900 font-medium">{message}</p>
          <Button asChild variant="outline">
            <Link to="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

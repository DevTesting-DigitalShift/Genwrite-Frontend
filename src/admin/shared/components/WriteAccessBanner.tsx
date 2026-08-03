import { Lock, Unlock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@components/ui/button"
import useAdminAuthStore from "@admin/auth/adminAuthStore"

function getErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || fallback
}

/**
 * Admin sessions are read-only by default. This lets an admin request an
 * emailed link to elevate the *current* session to read+write. Note:
 * isWriteElevated only reflects elevation performed in this tab (there's no
 * "am I elevated" endpoint), so on a fresh page load this always shows
 * read-only even if the session was elevated earlier in another tab/reload.
 */
export function WriteAccessBanner() {
  const isWriteElevated = useAdminAuthStore((s) => s.isWriteElevated)
  const requestWriteAccess = useAdminAuthStore((s) => s.requestWriteAccess)
  const [isRequesting, setIsRequesting] = useState(false)

  if (isWriteElevated) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
        <Unlock className="w-3.5 h-3.5" />
        Write access enabled
      </div>
    )
  }

  const handleRequest = async () => {
    try {
      setIsRequesting(true)
      const message = await requestWriteAccess()
      toast.success(message)
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to request write access."))
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRequest}
      disabled={isRequesting}
      className="h-8 text-xs border-gray-300"
    >
      <Lock className="w-3.5 h-3.5 mr-1.5" />
      {isRequesting ? "Sending link…" : "Read-only — Request Write Access"}
    </Button>
  )
}

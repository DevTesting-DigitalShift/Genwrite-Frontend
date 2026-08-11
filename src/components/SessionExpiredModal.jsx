import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import * as sessionStore from "@utils/sessionStore"
import { switchToAccount } from "@utils/accountSwitch"

/**
 * Shown when the active account's session expires (401) while other accounts are
 * still logged in — offers re-authenticating that account or switching to another,
 * instead of the old hard-redirect-to-/login behavior.
 */
const SessionExpiredModal = () => {
  const navigate = useNavigate()
  const [expiredEmail, setExpiredEmail] = useState(null)

  useEffect(() => {
    const handler = (event) => setExpiredEmail(event.detail?.email || "your account")
    window.addEventListener(sessionStore.SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(sessionStore.SESSION_EXPIRED_EVENT, handler)
  }, [])

  if (!expiredEmail) return null

  const otherSessions = sessionStore.getSessions()

  const handleReauth = () => {
    setExpiredEmail(null)
    navigate("/login?mode=add-account")
  }

  const handleSwitch = async (userId) => {
    setExpiredEmail(null)
    await switchToAccount(userId, { navigate })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setExpiredEmail(null)}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <AlertCircle className="size-6 text-amber-500 shrink-0" />
            <DialogTitle>Session expired</DialogTitle>
          </div>
          <DialogDescription>
            Your session for <span className="font-semibold">{expiredEmail}</span> has expired. Sign
            back in, or switch to another account you're already logged into.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleReauth}>Re-authenticate</Button>

          {otherSessions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Or switch to another account
              </p>
              <div className="flex flex-col gap-1.5">
                {otherSessions.map((session) => (
                  <Button
                    key={session.userId}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSwitch(session.userId)}
                  >
                    <span className="truncate">{session.name || session.email}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SessionExpiredModal

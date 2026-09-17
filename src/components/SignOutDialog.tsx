import { useState } from "react"
import { LogOut, Users, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog"

/**
 * Sign-out confirmation. With a single logged-in account it's a plain confirm; with
 * several it asks which scope to sign out of, so the header only ever needs one
 * "Sign Out" entry instead of two competing ones.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   sessions: Array<{userId: string, email: string, name: string}>,
 *   activeEmail?: string,
 *   onSignOutCurrent: () => Promise<void> | void,
 *   onSignOutAll: () => Promise<void> | void,
 * }} props
 */
const SignOutDialog = ({
  open,
  onOpenChange,
  sessions = [],
  activeEmail,
  onSignOutCurrent,
  onSignOutAll,
}: {
  open?: boolean
  onOpenChange: (open: boolean) => void
  sessions?: Array<{ userId: string; email?: string; name?: string; avatar?: string }>
  activeEmail?: string
  onSignOutCurrent: () => void | Promise<void>
  onSignOutAll: () => void | Promise<void>
}) => {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const hasMultiple = sessions.length > 1
  const isBusy = pendingAction !== null

  const run = async (action: string, handler: () => void | Promise<void>) => {
    setPendingAction(action)
    try {
      await handler()
      onOpenChange(false)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !isBusy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-50 shrink-0">
              <LogOut className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Sign out</DialogTitle>
          </div>
          <DialogDescription>
            {hasMultiple ? (
              <>
                You have <span className="font-semibold">{sessions.length} accounts</span> signed in
                on this browser. Choose how much you'd like to sign out of.
              </>
            ) : (
              <>
                Are you sure you want to sign out
                {activeEmail ? (
                  <>
                    {" "}
                    of <span className="font-semibold">{activeEmail}</span>
                  </>
                ) : null}
                ? You'll be returned to the login page.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasMultiple ? (
          <>
            <div className="flex flex-col gap-2 mt-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => run("current", onSignOutCurrent)}
                className="w-full flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="mt-0.5 shrink-0">
                  {pendingAction === "current" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  ) : (
                    <LogOut className="h-4 w-4 text-red-600" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Sign out of this account
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {activeEmail || "This account"} only — your other accounts stay signed in.
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => run("all", onSignOutAll)}
                className="w-full flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="mt-0.5 shrink-0">
                  {pendingAction === "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  ) : (
                    <Users className="h-4 w-4 text-red-600" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Sign out of all accounts
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Ends all {sessions.length} sessions on this browser.
                  </span>
                </span>
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          // Single account: a plain yes/no confirm — the scoped option cards above only make
          // sense when there's more than one session to choose between.
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => run("current", onSignOutCurrent)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pendingAction === "current" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SignOutDialog

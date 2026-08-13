import { useNavigate } from "react-router-dom"
import { Check, Plus, Info } from "lucide-react"
import * as sessionStore from "@utils/sessionStore"
import { switchToAccount } from "@utils/accountSwitch"

/**
 * "Accounts" section rendered inside the header's account dropdown — lists every
 * logged-in session in this browser, and lets you switch or add another. Signing out
 * lives in the header's single "Sign Out" entry (SignOutDialog), which covers both the
 * current-account and all-accounts cases.
 */
const AccountSwitcher = () => {
  const navigate = useNavigate()
  const sessions = sessionStore.getSessions()
  const activeSession = sessionStore.getActiveSession()
  const atLimit = sessions.length >= sessionStore.MAX_SESSIONS

  const handleSwitch = (userId) => {
    if (userId === activeSession?.userId) return
    switchToAccount(userId, { navigate })
  }

  const handleAddAccount = () => navigate("/login?mode=add-account")

  const addAccountItem = atLimit ? (
    <li>
      <div
        title={sessionStore.SESSION_LIMIT_MESSAGE}
        className="text-sm font-medium py-2 px-4 rounded-lg flex items-start gap-2 text-gray-400 cursor-not-allowed"
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="text-xs leading-snug">
          Account limit reached ({sessions.length}/{sessionStore.MAX_SESSIONS}). Sign out of one to
          add another.
        </span>
      </div>
    </li>
  ) : (
    <li>
      <button
        type="button"
        onClick={handleAddAccount}
        className="text-sm font-medium py-2! px-4! hover:bg-teal-50! rounded-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4 text-teal-500" /> Add another account
      </button>
    </li>
  )

  if (sessions.length <= 1) {
    // Nothing to switch between yet — just offer "Add another account".
    return addAccountItem
  }

  return (
    <>
      <li className="menu-title px-4 pt-1 pb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Accounts ({sessions.length}/{sessionStore.MAX_SESSIONS})
        </span>
      </li>
      {sessions.map((session) => {
        const isActive = session.userId === activeSession?.userId
        return (
          <li key={session.userId}>
            <button
              type="button"
              onClick={() => handleSwitch(session.userId)}
              className={`text-sm font-medium py-2! px-4! rounded-lg flex items-center gap-2 ${
                isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-50!"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                {session.avatar ? (
                  <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (session.name || session.email)?.[0]?.toUpperCase()
                )}
              </div>
              <span className="truncate flex-1 text-left">{session.name || session.email}</span>
              {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          </li>
        )
      })}
      {addAccountItem}
      <div className="divider my-1"></div>
    </>
  )
}

export default AccountSwitcher

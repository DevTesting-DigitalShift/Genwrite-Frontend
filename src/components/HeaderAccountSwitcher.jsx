import { useNavigate } from "react-router-dom"
import { Check, Plus, Info, ChevronDown, Eye, Home } from "lucide-react"
import { switchToAccount } from "@utils/accountSwitch"
import { SESSION_LIMIT_MESSAGE } from "@utils/sessionStore"
import { useSessions } from "@/hooks/useSessions"
import useWorkspaceStore from "@store/useWorkspaceStore"
import { useWorkspacesSharedWithMeQuery } from "@api/queries/collaborationQueries"

const Avatar = ({ src, fallback, className = "w-6 h-6 text-xs" }) => (
  <div
    className={`rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 ${className}`}
  >
    {src ? (
      <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
    ) : (
      fallback
    )}
  </div>
)

/**
 * Standalone header control for moving between the accounts signed in on this tab and the
 * workspaces shared with the active account. Switching an account here only affects THIS
 * tab — other tabs keep running whichever account they pinned (see @utils/sessionStore).
 */
const HeaderAccountSwitcher = () => {
  const navigate = useNavigate()
  const { sessions, activeSession, atLimit, maxSessions } = useSessions()
  const { activeWorkspace, switchToWorkspace, exitToOwnWorkspace } = useWorkspaceStore()

  // Only meaningful once you actually collaborate; skipped entirely otherwise so the
  // dropdown costs nothing for solo accounts.
  const { data: sharedData } = useWorkspacesSharedWithMeQuery(!!activeSession)
  const sharedWorkspaces = sharedData?.watching ?? []

  const handleSwitchAccount = (userId) => {
    if (userId === activeSession?.userId) return
    switchToAccount(userId, { navigate })
  }

  const handleSwitchWorkspace = (access) => {
    switchToWorkspace({
      id: access.ownerId._id,
      name: access.ownerId.name,
      email: access.ownerId.email,
      avatar: access.ownerId.avatar,
    })
    window.location.assign("/dashboard")
  }

  const handleExitWorkspace = () => {
    exitToOwnWorkspace()
    window.location.assign("/dashboard")
  }

  const label = activeWorkspace
    ? activeWorkspace.name || activeWorkspace.email
    : activeSession?.name || activeSession?.email || "Account"

  const hasNothingToSwitch = sessions.length <= 1 && sharedWorkspaces.length === 0
  if (hasNothingToSwitch && !activeWorkspace) return null

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        title="Switch account or workspace"
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2 hover:bg-gray-50 transition-colors max-w-[200px]"
      >
        <Avatar
          src={activeWorkspace ? activeWorkspace.avatar : activeSession?.avatar}
          fallback={label?.[0]?.toUpperCase()}
          className="w-7 h-7 text-xs"
        />
        <span className="hidden lg:block truncate text-sm font-semibold text-gray-800">
          {label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      <ul className="dropdown-content right-0 z-50 menu p-3 shadow-xl bg-white rounded-xl w-72 mt-2 border border-gray-200">
        <li className="menu-title px-3 pt-1 pb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Accounts ({sessions.length}/{maxSessions})
          </span>
        </li>
        {sessions.map((session) => {
          const isActive = session.userId === activeSession?.userId
          return (
            <li key={session.userId}>
              <button
                type="button"
                onClick={() => handleSwitchAccount(session.userId)}
                className={`text-sm font-medium py-2! px-3! rounded-lg flex items-center gap-2 ${
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-50!"
                }`}
              >
                <Avatar
                  src={session.avatar}
                  fallback={(session.name || session.email)?.[0]?.toUpperCase()}
                />
                <span className="truncate flex-1 text-left">{session.name || session.email}</span>
                {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            </li>
          )
        })}

        <li>
          {atLimit ? (
            <div
              title={SESSION_LIMIT_MESSAGE}
              className="text-xs py-2 px-3 rounded-lg flex items-start gap-2 text-gray-400 cursor-not-allowed"
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">
                Account limit reached ({sessions.length}/{maxSessions}). Sign out of one to add
                another.
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login?mode=add-account")}
              className="text-sm font-medium py-2! px-3! hover:bg-teal-50! rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-teal-500" /> Add another account
            </button>
          )}
        </li>

        {(sharedWorkspaces.length > 0 || activeWorkspace) && (
          <>
            <div className="divider my-1"></div>
            <li className="menu-title px-3 pt-1 pb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Workspaces
              </span>
            </li>
            <li>
              <button
                type="button"
                onClick={handleExitWorkspace}
                className={`text-sm font-medium py-2! px-3! rounded-lg flex items-center gap-2 ${
                  activeWorkspace ? "hover:bg-gray-50!" : "bg-primary/10 text-primary"
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1 text-left">My workspace</span>
                {!activeWorkspace && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            </li>
            {sharedWorkspaces.map((access) => {
              const isActive = activeWorkspace?.id === access.ownerId?._id
              return (
                <li key={access._id}>
                  <button
                    type="button"
                    onClick={() => handleSwitchWorkspace(access)}
                    className={`text-sm font-medium py-2! px-3! rounded-lg flex items-center gap-2 ${
                      isActive ? "bg-amber-50 text-amber-900" : "hover:bg-gray-50!"
                    }`}
                  >
                    <Avatar
                      src={access.ownerId?.avatar}
                      fallback={access.ownerId?.name?.[0]?.toUpperCase()}
                    />
                    <span className="truncate flex-1 text-left">
                      {access.ownerId?.name || access.ownerId?.email}
                    </span>
                    {isActive ? (
                      <Check className="w-4 h-4 shrink-0 text-amber-600" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    )}
                  </button>
                </li>
              )
            })}
            <li className="px-3 pt-1">
              <span className="text-[11px] leading-snug text-gray-400">
                Shared workspaces are read-only.
              </span>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}

export default HeaderAccountSwitcher

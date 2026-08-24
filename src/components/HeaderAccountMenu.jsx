import { useNavigate } from "react-router-dom"
import {
  Check,
  ChevronDown,
  CreditCard,
  Eye,
  History,
  Home,
  Info,
  LogOut,
  Plus,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react"
import { switchToAccount } from "@utils/accountSwitch"
import { SESSION_LIMIT_MESSAGE } from "@utils/sessionStore"
import { useSessions } from "@/hooks/useSessions"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import { useWorkspacesSharedWithMeQuery } from "@api/queries/collaborationQueries"

const Avatar = ({ src, fallback, className = "w-6 h-6 text-xs" }) => (
  <div
    className={`rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 ${className}`}
  >
    {src ? (
      <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
    ) : (
      fallback || <User className="w-1/2 h-1/2" />
    )}
  </div>
)

const SectionLabel = ({ children }) => (
  <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
    {children}
  </div>
)

const Row = ({ icon: Icon, leading, label, onClick, active, trailing, tone = "default" }) => {
  const tones = {
    default: "text-gray-700 hover:bg-gray-100",
    danger: "text-red-600 hover:bg-red-50",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-left transition-colors ${
        active ? "bg-primary/10 text-primary" : tones[tone]
      }`}
    >
      {/* Fixed-width slot so avatars and icons share one alignment column */}
      <span className="w-5 flex justify-center shrink-0">
        {leading || (Icon && <Icon className="w-4 h-4" />)}
      </span>
      <span className="truncate flex-1">{label}</span>
      {trailing}
    </button>
  )
}

/**
 * The single identity control in the header: who you are, which account is active, and
 * whose workspace this tab is watching — one avatar in place of the three overlapping
 * widgets this replaces. Carries the account-scoped destinations (profile, billing,
 * credits, collaboration) that don't belong in the left sidebar's content navigation.
 *
 * Switching an account here only affects THIS tab; other tabs keep whichever account they
 * pinned (see @utils/sessionStore). Read-only state is shown as a tint on the trigger, not
 * as a separate badge — the in-page WorkspaceAccessBanner already states it in words.
 */
const HeaderAccountMenu = ({ onSignOut }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { sessions, activeSession, atLimit, maxSessions } = useSessions()
  const { activeWorkspace, switchToWorkspace, exitToOwnWorkspace } = useWorkspaceStore()

  // Only meaningful once you actually collaborate; skipped entirely otherwise so the
  // dropdown costs nothing for solo accounts.
  const { data: sharedData } = useWorkspacesSharedWithMeQuery(!!activeSession)
  const sharedWorkspaces = sharedData?.watching ?? []

  const me = {
    name: user?.name || activeSession?.name,
    email: user?.email || activeSession?.email,
    avatar: user?.avatar || activeSession?.avatar,
  }

  const watching = !!activeWorkspace
  const ownerName = activeWorkspace?.name || activeWorkspace?.email || "shared workspace"

  // daisyUI dropdowns close on blur, so drop focus before any navigation.
  const close = () => document.activeElement?.blur?.()

  const go = path => {
    close()
    navigate(path)
  }

  const handleSwitchAccount = userId => {
    close()
    if (userId === activeSession?.userId) return
    switchToAccount(userId, { navigate })
  }

  // Full page loads rather than re-renders: in-flight queries were scoped to an owner via
  // the X-Watch-As header, so the cleanest way across the boundary is a fresh load.
  const handleSwitchWorkspace = access => {
    switchToWorkspace({
      id: access.ownerId._id,
      name: access.ownerId.name,
      email: access.ownerId.email,
      avatar: access.ownerId.avatar,
    })
    window.location.assign("/dashboard")
  }

  const handleExitWorkspace = () => {
    // Already home: nothing to unscope, so don't burn a page load on it.
    if (!activeWorkspace) return close()
    exitToOwnWorkspace()
    window.location.assign("/dashboard")
  }

  const triggerLabel = watching ? ownerName : me.name || me.email || "Account"

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        aria-label="Account menu"
        title={
          watching
            ? `Viewing ${ownerName}'s workspace (read-only)`
            : me.email || "Account and workspace"
        }
        className={`flex h-10 shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border py-1 pl-1 pr-2 sm:pr-2.5 transition-colors max-w-40 lg:max-w-55 ${
          watching
            ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <Avatar
          src={watching ? activeWorkspace.avatar : me.avatar}
          fallback={triggerLabel?.[0]?.toUpperCase()}
          className={`w-8 h-8 text-sm ${watching ? "ring-2 ring-amber-300" : ""}`}
        />
        {watching && <Eye className="h-4 w-4 shrink-0 text-amber-600" />}
        <span
          className={`hidden lg:block truncate text-sm font-semibold ${
            watching ? "text-amber-900" : "text-gray-800"
          }`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 ${watching ? "text-amber-500" : "text-gray-400"}`}
        />
      </button>

      {/* Never wider than the viewport: the trigger sits against the right edge on phones,
          so a fixed 20rem panel would spill off-screen. dvh keeps the scroll area correct
          under mobile browser chrome. */}
      <div className="dropdown-content right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
        {/* Who you are — always your own account, never the workspace you're watching */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar
            src={me.avatar}
            fallback={me.name?.[0]?.toUpperCase()}
            className="w-10 h-10 text-base"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{me.name}</p>
            <p className="truncate text-xs text-gray-500">{me.email}</p>
          </div>
        </div>

        <div className="my-2 h-px bg-gray-100" />

        <Row icon={User} label="Profile" onClick={() => go("/profile")} />
        {/* Analytics reads /blogs/status, which is a watchable route — so it resolves to
            whichever workspace this tab is scoped to and stays useful while watching. */}
        <Row icon={TrendingUp} label="Analytics" onClick={() => go("/analytics")} />
        {/* Billing, credits, plan and collaboration are all owner-account concerns —
            hidden while this tab is watching someone else's workspace. */}
        {!watching && (
          <>
            <Row
              icon={CreditCard}
              label="Subscription & Billing"
              onClick={() => go("/transactions")}
            />
            <Row icon={History} label="Credit History" onClick={() => go("/credit-logs")} />
            <Row icon={Sparkles} label="Upgrade Plan" onClick={() => go("/pricing")} />
            <Row icon={Users} label="Collaboration" onClick={() => go("/collaboration")} />
          </>
        )}

        <div className="my-2 h-px bg-gray-100" />

        <SectionLabel>
          Accounts ({sessions.length}/{maxSessions})
        </SectionLabel>
        {sessions.map(session => {
          const isActive = session.userId === activeSession?.userId
          return (
            <Row
              key={session.userId}
              label={session.name || session.email}
              active={isActive}
              onClick={() => handleSwitchAccount(session.userId)}
              leading={
                <Avatar
                  src={session.avatar}
                  fallback={(session.name || session.email)?.[0]?.toUpperCase()}
                  className="w-5 h-5 text-[10px]"
                />
              }
              trailing={isActive ? <Check className="w-4 h-4 text-primary shrink-0" /> : null}
            />
          )
        })}
        {atLimit ? (
          <div
            title={SESSION_LIMIT_MESSAGE}
            className="flex items-start gap-2 px-3 py-2 text-xs text-gray-400"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">
              Account limit reached. Sign out of one to add another.
            </span>
          </div>
        ) : (
          <Row
            icon={Plus}
            label="Add another account"
            onClick={() => go("/login?mode=add-account")}
          />
        )}

        {(sharedWorkspaces.length > 0 || watching) && (
          <>
            <SectionLabel>Workspaces</SectionLabel>
            <Row
              icon={Home}
              label="My workspace"
              active={!watching}
              onClick={handleExitWorkspace}
              trailing={!watching ? <Check className="w-4 h-4 text-primary shrink-0" /> : null}
            />
            {sharedWorkspaces.map(access => {
              const isActive = activeWorkspace?.id === access.ownerId?._id
              return (
                <Row
                  key={access._id}
                  icon={Eye}
                  label={access.ownerId?.name || access.ownerId?.email}
                  active={isActive}
                  onClick={() => handleSwitchWorkspace(access)}
                  trailing={
                    isActive ? (
                      <Check className="w-4 h-4 shrink-0 text-primary" />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        View
                      </span>
                    )
                  }
                />
              )
            })}
          </>
        )}

        <div className="my-2 h-px bg-gray-100" />

        <Row
          icon={LogOut}
          label="Sign out"
          tone="danger"
          onClick={() => {
            close()
            onSignOut?.()
          }}
        />
      </div>
    </div>
  )
}

export default HeaderAccountMenu

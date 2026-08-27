import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, Eye, X, Inbox, Users } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useWorkspaceStore from "@store/useWorkspaceStore"
import {
  useInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useWorkspacesSharedWithMeQuery,
} from "@api/queries/collaborationQueries"

const MAX_ACTIVE_INVITES = 5

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  revoked: { label: "Revoked", className: "bg-slate-100 text-slate-500 ring-slate-200" },
}

/** What a collaborator actually gets — spelled out so the inviter isn't guessing. */
const _ACCESS_SCOPE = [
  "Blogs and published content",
  "Brand voices",
  "Content agent jobs",
  "Search Console analytics",
]

const formatDate = value =>
  new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

const StatusPill = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}

const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-xl border border-slate-200/70 shadow-sm ${className}`}>
    {children}
  </div>
)

const Avatar = ({ src, fallback }) => (
  <div className="w-9 h-9 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center overflow-hidden">
    {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : fallback}
  </div>
)

const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
      <Icon className="size-5" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="text-xs text-slate-400 max-w-xs">{hint}</p>
  </div>
)

const SeatMeter = ({ used, max }) => {
  const pct = Math.min(100, (used / max) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-600">Seats used</span>
        <span className="font-bold text-slate-900">
          {used}
          <span className="text-slate-400 font-medium"> / {max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${used >= max ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const InvitePanel = ({ activeCount, atLimit }) => {
  const [email, setEmail] = useState("")
  const { mutate: createInvite, isPending } = useCreateInviteMutation()

  const handleSubmit = e => {
    e.preventDefault()
    if (!email.trim()) return
    createInvite({ email: email.trim() }, { onSuccess: () => setEmail("") })
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <UserPlus className="size-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">Invite a teammate</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            required
            disabled={atLimit}
            placeholder="teammate@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isPending || atLimit} className="w-full">
          <UserPlus className="size-4" />
          {isPending ? "Sending..." : "Send invite"}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <SeatMeter used={activeCount} max={MAX_ACTIVE_INVITES} />
        {atLimit && (
          <p className="mt-2 text-xs text-amber-600 font-medium">
            All seats are in use. Revoke an invite to free one up.
          </p>
        )}
      </div>
    </Card>
  )
}

const InvitesSentTab = () => {
  const { data, isLoading } = useInvitesQuery()
  const { mutate: revokeInvite } = useRevokeInviteMutation()
  const { handlePopup } = useConfirmPopup()
  const invites = data?.invites ?? []
  const activeCount = invites.filter(i => i.status !== "revoked").length

  const confirmRevoke = invite => {
    handlePopup({
      title: "Revoke invite?",
      description: `${invite.inviteeEmail} will lose access to your workspace immediately.`,
      confirmText: "Revoke",
      confirmProps: {
        className:
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors",
      },
      onConfirm: () => revokeInvite(invite._id),
    })
  }

  return (
    // Invite panel leads on mobile (it's the action), sits alongside on desktop so the
    // table gets the full remaining width instead of a narrow centred column.
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Card className="order-last lg:order-first overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">People I've invited</h2>
          {invites.length > 0 && (
            <span className="text-xs font-semibold text-slate-400">
              {invites.length} total · {activeCount} active
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading invites...</div>
        ) : invites.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No invites yet"
            hint="Send an invite and your teammate will show up here with their status."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Teammate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map(invite => (
                <TableRow key={invite._id}>
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={invite.inviteeEmail?.[0]?.toUpperCase()} />
                      <span className="font-medium text-slate-800 break-all">
                        {invite.inviteeEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={invite.status} />
                  </TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {formatDate(invite.createdAt)}
                  </TableCell>
                  <TableCell className="text-right pr-5">
                    {invite.status !== "revoked" && (
                      <button
                        type="button"
                        onClick={() => confirmRevoke(invite)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <X className="size-3.5" />
                        Revoke
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <aside className="order-first lg:order-last space-y-4 lg:sticky lg:top-24">
        <InvitePanel activeCount={activeCount} atLimit={activeCount >= MAX_ACTIVE_INVITES} />
      </aside>
    </div>
  )
}

const WorkspacesSharedWithMeTab = () => {
  const { data, isLoading } = useWorkspacesSharedWithMeQuery()
  const { switchToWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()
  const workspaces = data?.watching ?? []

  const handleView = access => {
    switchToWorkspace({
      id: access.ownerId._id,
      name: access.ownerId.name,
      email: access.ownerId.email,
      avatar: access.ownerId.avatar,
    })
    navigate("/dashboard")
  }

  if (isLoading) {
    return (
      <Card>
        <div className="py-16 text-center text-sm text-slate-400">Loading...</div>
      </Card>
    )
  }

  if (workspaces.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="No shared workspaces"
          hint="When someone invites you to their workspace, it'll appear here to switch into."
        />
      </Card>
    )
  }

  // Cards rather than a single-column list: several owners fill the row instead of
  // stacking down the left edge of an otherwise empty page.
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {workspaces.map(access => (
        <Card
          key={access._id}
          className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <Avatar
              src={access.ownerId?.avatar}
              fallback={access.ownerId?.name?.[0]?.toUpperCase()}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-slate-800 truncate">
                {access.ownerId?.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{access.ownerId?.email}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
              <Eye className="size-3" />
              Read-only
            </span>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleView(access)}>
            <Eye className="size-3.5" />
            View workspace
          </Button>
        </Card>
      ))}
    </div>
  )
}

const Collaboration = () => {
  // Same cache key the tab uses, so this costs no extra request.
  const { data: invitesData } = useInvitesQuery()
  const { data: sharedData } = useWorkspacesSharedWithMeQuery()
  const inviteCount = invitesData?.invites?.length ?? 0
  const sharedCount = sharedData?.watching?.length ?? 0

  return (
    <div className="mx-auto w-full max-w-350 py-6 sm:py-8 md:p-6 p-3 md:mt-0 mt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Collaboration</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Invite teammates for read-only access to your workspace, or switch into a workspace that's
          been shared with you.
        </p>
      </header>

      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites" className="gap-1.5">
            People I've invited
            {inviteCount > 0 && (
              <span className="rounded-full bg-slate-200/70 px-1.5 text-[10px] font-bold text-slate-600">
                {inviteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-1.5">
            Workspaces shared with me
            {sharedCount > 0 && (
              <span className="rounded-full bg-slate-200/70 px-1.5 text-[10px] font-bold text-slate-600">
                {sharedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="mt-5">
          <InvitesSentTab />
        </TabsContent>
        <TabsContent value="shared" className="mt-5">
          <WorkspacesSharedWithMeTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Collaboration

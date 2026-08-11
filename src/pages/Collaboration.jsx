import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, Eye, X } from "lucide-react"
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
  pending: { label: "Pending", className: "bg-amber-500 text-white" },
  accepted: { label: "Accepted", className: "bg-green-500 text-white" },
  revoked: { label: "Revoked", className: "bg-slate-400 text-white" },
}

const StatusPill = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  )
}

const InviteForm = () => {
  const [email, setEmail] = useState("")
  const { mutate: createInvite, isPending } = useCreateInviteMutation()

  const handleSubmit = e => {
    e.preventDefault()
    if (!email.trim()) return
    createInvite({ email: email.trim() }, { onSuccess: () => setEmail("") })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1">
        <Label htmlFor="invite-email">Invite by email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          placeholder="teammate@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        <UserPlus className="size-4" />
        {isPending ? "Sending..." : "Send invite"}
      </Button>
    </form>
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
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
      <InviteForm />
      <p className="text-xs text-slate-400 font-medium mt-3">
        {activeCount}/{MAX_ACTIVE_INVITES} active invites used. Invited teammates get read-only
        access to your blogs, brands, jobs, and Search Console data.
      </p>

      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            You haven't invited anyone yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map(invite => (
                <TableRow key={invite._id}>
                  <TableCell className="font-medium">{invite.inviteeEmail}</TableCell>
                  <TableCell>
                    <StatusPill status={invite.status} />
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
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
      </div>
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

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
      ) : workspaces.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          No workspaces have been shared with you yet.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {workspaces.map(access => (
            <li key={access._id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden">
                  {access.ownerId?.avatar ? (
                    <img
                      src={access.ownerId.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    access.ownerId?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{access.ownerId?.name}</p>
                  <p className="text-xs text-slate-400">{access.ownerId?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleView(access)}>
                <Eye className="size-3.5" />
                View workspace
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Collaboration = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10">
      <h1 className="text-2xl font-black text-slate-900 mb-1">Collaboration</h1>
      <p className="text-sm text-slate-500 mb-6">
        Invite teammates for read-only access to your workspace, or switch into a workspace that's
        been shared with you.
      </p>

      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites">People I've invited</TabsTrigger>
          <TabsTrigger value="shared">Workspaces shared with me</TabsTrigger>
        </TabsList>
        <TabsContent value="invites">
          <InvitesSentTab />
        </TabsContent>
        <TabsContent value="shared">
          <WorkspacesSharedWithMeTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Collaboration

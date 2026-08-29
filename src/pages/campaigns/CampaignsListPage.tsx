import type { MouseEvent } from "react"
import { useEffect } from "react"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"
import { Plus, Target, Calendar, FileStack, Loader2, Trash2, Pencil } from "lucide-react"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { toast } from "sonner"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { CampaignFormDialog } from "@/features/campaigns/CampaignFormDialog"
import { PanelError } from "@/features/campaigns/CampaignStates"
import { CampaignStatusControl } from "@/features/campaigns/CampaignStatusControl"
import { getFriendlyError } from "@utils/friendlyError"
import { getSocket } from "@utils/socket"
import { useCampaignFormUI } from "@/features/campaigns/campaignForm.reducer"
import type { Campaign, CampaignStatusType } from "@/types/campaign"


const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

export default function CampaignsListPage() {
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { data: campaigns = [], isLoading, isError, error, refetch } = campaignsQuery.useList()
  const { state: uiState, actions } = useCampaignFormUI()

  const deleteMutation = campaignsQuery.useDelete({
    onSuccess: () => toast.success("Campaign deleted"),
    onError: (err) => toast.error(getFriendlyError(err, "campaign")),
  })

  // The weekly job auto-completes campaigns past their endDate, so a status here can
  // change with no request from this tab to hang a cache update off.
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStatusChanged = ({
      campaignId,
      status,
    }: {
      campaignId: string
      status: CampaignStatusType
    }) => {
      if (!campaignId) return
      campaignsQuery.applyStatusChange(campaignId, status)
    }

    socket.on("campaign:statusChanged", handleStatusChanged)
    return () => {
      socket.off("campaign:statusChanged", handleStatusChanged)
    }
  }, [])

  const handleDelete = (campaign: Campaign) => {
    handlePopup({
      title: "Delete campaign?",
      description: (
        <span className="my-2">
          Are you sure you want to delete <b>{campaign.name}</b>? This action cannot be undone.
        </span>
      ),
      confirmText: "Delete",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(campaign._id)
      },
      confirmProps: {
        className:
          "border-red-200 bg-red-50 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-white",
      },
    })
  }

  return (
    <main className="max-container mx-auto flex min-h-[calc(100vh-5rem)] flex-col gap-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>Campaigns | GenWrite</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Group blogs under a shared SEO goal and get weekly suggestions toward it.
          </p>
        </div>
        {campaigns.length > 0 && (
          <Button onClick={actions.openCreate}>
            <Plus className="size-4" /> New campaign
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-muted/40">
          <PanelError
            title="Couldn't load your campaigns"
            description={getFriendlyError(error, "campaign")}
            onRetry={() => refetch()}
          />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-muted/40 p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">
              Create one to start tracking blogs toward a shared goal.
            </p>
          </div>
          <Button onClick={actions.openCreate}>
            <Plus className="size-4" /> New campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign._id}
              className="cursor-pointer border-slate-200/70 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              onClick={() => navigate(`/campaigns/${campaign._id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CampaignStatusControl status={campaign.status} readOnly />
                </div>
                {campaign.description && (
                  <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileStack className="size-3.5" />
                    {campaign.blogIds.length} blog{campaign.blogIds.length === 1 ? "" : "s"}
                  </span>
                  {campaign.targets.clicks != null && (
                    <span className="flex items-center gap-1">
                      <Target className="size-3.5" />
                      {campaign.targets.clicks} clicks target
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit campaign"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      actions.openEdit(campaign._id)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete campaign"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      handleDelete(campaign)
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampaignFormDialog
        uiState={uiState}
        onClose={actions.close}
        onTabChange={actions.setTab}
        onBlogSearchChange={actions.setBlogSearch}
        campaigns={campaigns}
      />
    </main>
  )
}

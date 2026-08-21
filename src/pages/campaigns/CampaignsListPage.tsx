import type { MouseEvent } from "react"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"
import { Plus, Target, Calendar, FileStack, Loader2, Trash2, Pencil } from "lucide-react"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { toast } from "sonner"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { CampaignFormDialog } from "@/features/campaigns/CampaignFormDialog"
import { useCampaignFormUI } from "@/features/campaigns/campaignForm.reducer"
import type { Campaign, CampaignStatusType } from "@/types/campaign"

const STATUS_BADGE: Record<CampaignStatusType, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

export default function CampaignsListPage() {
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { data: campaigns = [], isLoading } = campaignsQuery.useList()
  const { state: uiState, actions } = useCampaignFormUI()

  const deleteMutation = campaignsQuery.useDelete({
    onSuccess: () => toast.success("Campaign deleted"),
    onError: () => toast.error("Failed to delete campaign"),
  })

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
        type: "text",
        className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
      },
      cancelProps: { danger: false },
    })
  }

  return (
    <main className="max-container mx-auto space-y-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>Campaigns | GenWrite</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Group blogs under a shared SEO goal and get weekly suggestions toward it.
          </p>
        </div>
        <Button onClick={actions.openCreate}>
          <Plus className="size-4" /> New campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-10 bg-muted/40 rounded-xl border-2 border-dashed text-center text-muted-foreground">
          No campaigns yet. Create one to start tracking blogs toward a shared goal.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/campaigns/${campaign._id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <Badge className={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
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

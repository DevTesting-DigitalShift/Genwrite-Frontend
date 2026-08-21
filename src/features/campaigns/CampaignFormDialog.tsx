import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs"
import { Loader2 } from "lucide-react"
import { RHFTextField, RHFTextareaField, RHFNumberField, RHFSwitchField } from "@components/form/fields"
import { campaignFormSchema, campaignFormDefaultValues } from "./campaignForm.schema"
import type { CampaignFormValues } from "./campaignForm.schema"
import { KeywordTargetsField } from "./KeywordTargetsField"
import { BlogMultiSelectField } from "./BlogMultiSelectField"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import type { Campaign, CampaignBlogRef } from "@/types/campaign"
import type { CampaignFormUIState } from "./campaignForm.types"

function toFormValues(campaign?: Campaign): CampaignFormValues {
  if (!campaign) return campaignFormDefaultValues
  return {
    name: campaign.name,
    description: campaign.description ?? "",
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate.slice(0, 10),
    blogIds: campaign.blogIds,
    targets: campaign.targets,
    automation: campaign.automation,
  }
}

interface CampaignFormDialogProps {
  uiState: CampaignFormUIState
  onClose: () => void
  onTabChange: (tab: CampaignFormUIState["activeTab"]) => void
  onBlogSearchChange: (query: string) => void
  campaigns: Campaign[]
}

export function CampaignFormDialog({
  uiState,
  onClose,
  onTabChange,
  onBlogSearchChange,
  campaigns,
}: CampaignFormDialogProps) {
  const editingCampaign = useMemo(
    () => campaigns.find((c) => c._id === uiState.editingCampaignId),
    [campaigns, uiState.editingCampaignId]
  )

  const { data: allBlogs = [], isLoading: isBlogsLoading } = useAllBlogsQuery()
  const blogRefs: CampaignBlogRef[] = allBlogs.map((b: { _id: string; title?: string }) => ({
    _id: b._id,
    title: b.title ?? "Untitled blog",
  }))

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: campaignFormDefaultValues,
  })

  useEffect(() => {
    if (uiState.isOpen) reset(toFormValues(editingCampaign))
  }, [uiState.isOpen, editingCampaign, reset])

  const createMutation = campaignsQuery.useCreate({
    onSuccess: () => {
      toast.success("Campaign created")
      onClose()
    },
    onError: () => toast.error("Failed to create campaign"),
  })

  const updateMutation = campaignsQuery.useUpdate({
    onSuccess: () => {
      toast.success("Campaign updated")
      onClose()
    },
    onError: () => toast.error("Failed to update campaign"),
  })

  const onSubmit = (values: CampaignFormValues) => {
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign._id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const autoApply = useWatch({ control, name: "automation.autoApply" })

  return (
    <Dialog open={uiState.isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCampaign ? "Edit campaign" : "New campaign"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={uiState.activeTab}
            onValueChange={(v: string) => onTabChange(v as CampaignFormUIState["activeTab"])}
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="targets">Targets</TabsTrigger>
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 pt-4">
              <RHFTextField control={control} name="name" label="Campaign name" required placeholder="Q1 SEO Push" />
              <RHFTextareaField
                control={control}
                name="description"
                label="Description"
                placeholder="What is this campaign trying to achieve?"
              />
              <div className="grid grid-cols-2 gap-4">
                <RHFTextField control={control} name="startDate" label="Start date" required type="date" />
                <RHFTextField control={control} name="endDate" label="End date" required type="date" />
              </div>
            </TabsContent>

            <TabsContent value="targets" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <RHFNumberField
                  control={control}
                  name="targets.clicks"
                  label="Target clicks"
                  nullable
                  min={0}
                  placeholder="e.g. 5000"
                />
                <RHFNumberField
                  control={control}
                  name="targets.impressions"
                  label="Target impressions"
                  nullable
                  min={0}
                  placeholder="e.g. 100000"
                />
                <RHFNumberField
                  control={control}
                  name="targets.avgPosition"
                  label="Target avg. position"
                  nullable
                  min={1}
                  placeholder="e.g. 5"
                />
              </div>
              <KeywordTargetsField control={control} register={register} />
            </TabsContent>

            <TabsContent value="blogs" className="pt-4">
              <BlogMultiSelectField
                control={control}
                name="blogIds"
                blogs={blogRefs}
                isLoading={isBlogsLoading}
                search={uiState.blogSearch}
                onSearchChange={onBlogSearchChange}
              />
            </TabsContent>

            <TabsContent value="automation" className="space-y-1 pt-4">
              <RHFSwitchField
                control={control}
                name="automation.autoSuggest"
                label="Auto-suggest"
                description="Weekly job generates AI suggestions for underperforming blogs in this campaign."
              />
              <RHFSwitchField
                control={control}
                name="automation.autoApply"
                label="Auto-apply rewrites"
                description="High-priority suggestions get rewritten automatically, without manual review."
              />
              <RHFSwitchField
                control={control}
                name="automation.autoRepost"
                label="Auto-repost after rewrite"
                description="Republish to the connected CMS after an auto-applied rewrite."
                disabled={!autoApply}
              />
              {errors.automation?.autoRepost && (
                <p className="text-xs text-destructive">{errors.automation.autoRepost.message}</p>
              )}
              <RHFNumberField
                control={control}
                name="automation.maxAutoActionsPerWeek"
                label="Max auto-actions per week"
                min={1}
                className="max-w-48 pt-2"
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingCampaign ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useMemo, useRef } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import dayjs from "dayjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  RHFTextField,
  RHFTextareaField,
  RHFNumberField,
  RHFSwitchField,
  RHFDateField,
} from "@components/form/fields"
import { campaignFormSchema, campaignFormDefaultValues } from "./campaignForm.schema"
import type { CampaignFormValues } from "./campaignForm.schema"
import { CAMPAIGN_STEPS, stepIndexOf } from "./campaignForm.steps"
import { CampaignStepper } from "./CampaignStepper"
import { KeywordTargetsField } from "./KeywordTargetsField"
import { BlogMultiSelectField } from "./BlogMultiSelectField"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import type { Campaign, CampaignBlogRef } from "@/types/campaign"
import type { CampaignFormUIState } from "./campaignForm.types"
import { getValueByPath } from "@utils/ObjectPath"
import { COSTS } from "@/data/blogData"

/** How long after a step change the submit button ignores clicks. */
const SUBMIT_ARM_DELAY_MS = 400

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
    trigger,
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

  // `mutate` is fire-and-forget: it returns before the request does, so RHF's
  // `isSubmitting` would drop straight back to false and the button would never
  // show it was working. Awaiting `mutateAsync` keeps the spinner up for the real
  // duration and blocks a second click from creating a duplicate campaign.
  const onSubmit = async (values: CampaignFormValues) => {
    // "Next" and "Create campaign" are the same button in the same place, and React
    // reuses the DOM node across the swap — so a quick second click on Next lands on
    // a submit the user never aimed at. Ignore submits that arrive faster than a
    // deliberate click could.
    if (Date.now() - lastStepChangeAt.current < SUBMIT_ARM_DELAY_MS) return

    try {
      if (editingCampaign) {
        await updateMutation.mutateAsync({ id: editingCampaign._id, data: values })
      } else {
        await createMutation.mutateAsync(values)
      }
    } catch {
      // The mutation's onError already surfaces a toast — swallow the rejection so
      // it doesn't escape the submit handler as an unhandled promise.
    }
  }

  const autoApply = useWatch({ control, name: "automation.autoApply" })
  const maxActions = useWatch({ control, name: "automation.maxAutoActionsPerWeek" })
  const startDate = useWatch({ control, name: "startDate" })

  // A campaign can't start in the past, and it must end strictly after it starts —
  // so the end-date calendar opens the day after whatever start date is chosen.
  const today = dayjs().format("YYYY-MM-DD")
  const earliestEndDate = startDate ? dayjs(startDate).add(1, "day").format("YYYY-MM-DD") : today

  const stepIndex = stepIndexOf(uiState.activeTab)
  const isLastStep = stepIndex === CAMPAIGN_STEPS.length - 1

  // Timestamp of the last step change, used to disarm the submit button briefly.
  const lastStepChangeAt = useRef(0)
  useEffect(() => {
    lastStepChangeAt.current = Date.now()
  }, [])

  /** Validates the current step's own fields, so errors land where the user is. */
  const validateStep = (index: number) => trigger(CAMPAIGN_STEPS[index].fields)

  const goToTab = (tab: CampaignFormUIState["activeTab"]) => {
    lastStepChangeAt.current = Date.now()
    onTabChange(tab)
  }

  const goNext = async () => {
    if (!(await validateStep(stepIndex))) return
    goToTab(CAMPAIGN_STEPS[stepIndex + 1].id)
  }

  const goBack = () => goToTab(CAMPAIGN_STEPS[stepIndex - 1].id)

  /**
   * Final submit re-checks the whole schema, so an error can still come back from a
   * step the user has already left (editing an existing campaign, mostly). Send them
   * to it rather than leaving the error rendered on a screen they can't see.
   */
  const onInvalidSubmit = (formErrors: FieldErrors<CampaignFormValues>) => {
    const invalidStep = CAMPAIGN_STEPS.findIndex((step) =>
      step.fields.some((field) => getValueByPath(formErrors, field))
    )
    if (invalidStep >= 0 && invalidStep !== stepIndex) {
      goToTab(CAMPAIGN_STEPS[invalidStep].id)
    }
    toast.error("Please fix the highlighted fields.")
  }

  /**
   * Clicking the stepper: backwards is always allowed, forwards has to clear every
   * step in between — landing on the first one that fails rather than skipping it.
   */
  const goToStep = async (target: number) => {
    if (target <= stepIndex) {
      goToTab(CAMPAIGN_STEPS[target].id)
      return
    }
    for (let i = stepIndex; i < target; i++) {
      if (!(await validateStep(i))) {
        goToTab(CAMPAIGN_STEPS[i].id)
        return
      }
    }
    goToTab(CAMPAIGN_STEPS[target].id)
  }

  return (
    <Dialog
      open={uiState.isOpen}
      onOpenChange={(open: boolean) => {
        if (!open && !isSubmitting) onClose()
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden"
        // A half-filled wizard is easy to lose to a stray click — only Cancel,
        // the X, or Escape should close it.
        onInteractOutside={(e: Event) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{editingCampaign ? "Edit campaign" : "New campaign"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
          onKeyDown={(e) => {
            // Enter shouldn't submit a half-finished wizard — advance instead.
            if (e.key === "Enter" && !isLastStep && e.target instanceof HTMLElement) {
              if (e.target.tagName !== "TEXTAREA") {
                e.preventDefault()
                void goNext()
              }
            }
          }}
          className="min-w-0 space-y-5"
        >
          <CampaignStepper
            currentIndex={stepIndex}
            onStepSelect={(tab) => void goToStep(stepIndexOf(tab))}
          />

          {uiState.activeTab === "basics" && (
            <div className="min-w-0 space-y-4">
              <RHFTextField
                control={control}
                name="name"
                label="Campaign name"
                required
                placeholder="Q1 SEO Push"
              />
              <RHFTextareaField
                control={control}
                name="description"
                label="Description"
                placeholder="What is this campaign trying to achieve?"
              />
              <div className="grid grid-cols-2 gap-4">
                <RHFDateField
                  control={control}
                  name="startDate"
                  label="Start date"
                  required
                  minDate={today}
                />
                <RHFDateField
                  control={control}
                  name="endDate"
                  label="End date"
                  required
                  minDate={earliestEndDate}
                />
              </div>
            </div>
          )}

          {uiState.activeTab === "targets" && (
            <div className="min-w-0 space-y-4">
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
            </div>
          )}

          {uiState.activeTab === "blogs" && (
            <div className="min-w-0">
              <BlogMultiSelectField
                control={control}
                name="blogIds"
                blogs={blogRefs}
                isLoading={isBlogsLoading}
                search={uiState.blogSearch}
                onSearchChange={onBlogSearchChange}
              />
            </div>
          )}

          {uiState.activeTab === "automation" && (
            <div className="min-w-0 space-y-1">
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
                inline
                className="pt-1"
              />
              {autoApply && (
                <div className="mt-3 flex gap-2.5 rounded-xl bg-amber-50 p-3 text-amber-900">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed">
                    Auto-apply spends credits without asking each time —{" "}
                    <strong>
                      {COSTS.BLOG_INSIGHT.APPLY} credits per rewrite, up to{" "}
                      {COSTS.BLOG_INSIGHT.APPLY * (Number(maxActions) || 0)} per week
                    </strong>{" "}
                    at the current limit. Leave it off to review each rewrite yourself.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {CAMPAIGN_STEPS.length}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={stepIndex === 0 ? onClose : goBack}
              >
                {stepIndex === 0 ? "Cancel" : "Back"}
              </Button>
              {isLastStep ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {editingCampaign ? "Save changes" : "Create campaign"}
                </Button>
              ) : (
                <Button type="button" onClick={() => void goNext()}>
                  Next
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

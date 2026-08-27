import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CAMPAIGN_STEPS } from "./campaignForm.steps"
import type { CampaignFormTab } from "./campaignForm.types"

interface CampaignStepperProps {
  currentIndex: number
  onStepSelect: (tab: CampaignFormTab) => void
}

/** Progress header for the campaign wizard: numbered steps, completed ones ticked. */
export function CampaignStepper({ currentIndex, onStepSelect }: CampaignStepperProps) {
  return (
    <ol className="flex items-center gap-1">
      {CAMPAIGN_STEPS.map((step, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <li key={step.id} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => onStepSelect(step.id)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isCurrent
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isComplete && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isCurrent && "border-input text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {index < CAMPAIGN_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 transition-colors",
                  isComplete ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

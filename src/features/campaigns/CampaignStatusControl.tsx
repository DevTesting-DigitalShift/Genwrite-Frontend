import { Check, ChevronDown, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CampaignStatus, type CampaignStatusType } from "@/types/campaign"

export const STATUS_PILL: Record<CampaignStatusType, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
}

const STATUS_ORDER: CampaignStatusType[] = [
  CampaignStatus.ACTIVE,
  CampaignStatus.PAUSED,
  CampaignStatus.COMPLETED,
]

const STATUS_HINT: Record<CampaignStatusType, string> = {
  active: "Weekly suggestions and automation run",
  paused: "Automation stops, data keeps collecting",
  completed: "Archived — no further automation",
}

interface CampaignStatusControlProps {
  status: CampaignStatusType
  onChange: (status: CampaignStatusType) => void
  isPending?: boolean
  /** Read-only pill, for lists where the status isn't editable. */
  readOnly?: boolean
}

/** The status pill, doubling as the control that changes it. */
export function CampaignStatusControl({
  status,
  onChange,
  isPending,
  readOnly,
}: CampaignStatusControlProps) {
  const pill = cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
    STATUS_PILL[status]
  )

  if (readOnly) return <span className={pill}>{status}</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          aria-label={`Campaign status: ${status}. Change status`}
          className={cn(pill, "transition-opacity hover:opacity-80 disabled:opacity-60")}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          {status}
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {STATUS_ORDER.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => option !== status && onChange(option)}
            className="flex items-start gap-2"
          >
            <Check
              className={cn("mt-0.5 size-4 shrink-0", option === status ? "" : "invisible")}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium capitalize">{option}</span>
              <span className="block text-xs text-muted-foreground">{STATUS_HINT[option]}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { Check, ChevronDown, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CampaignStatus, type CampaignStatusType } from "@/types/campaign"

/** Pill colors. Exported so the campaigns list renders a status identically to the
 * detail page — the same status must never read as two different colors. */
export const STATUS_PILL: Record<CampaignStatusType, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
}

/** Solid counterpart of each pill color. Lets a menu row preview the pill it produces,
 * so the choice is recognisable before it's made rather than only after. */
export const STATUS_DOT: Record<CampaignStatusType, string> = {
  active: "bg-primary",
  paused: "bg-amber-500",
  completed: "bg-slate-400",
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

/** Shared between the read-only pill and the trigger, so the control doesn't change
 * shape or size depending on whether the user happens to be allowed to edit it. */
export const STATUS_PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"

/** A union rather than an all-optional bag: the read-only pill has nothing to change,
 * so it shouldn't have to pass a throwaway `onChange` to satisfy the type. */
type CampaignStatusControlProps =
  | {
      status: CampaignStatusType
      /** Read-only pill, for lists where the status isn't editable. */
      readOnly: true
      onChange?: never
      isPending?: never
    }
  | {
      status: CampaignStatusType
      readOnly?: false
      onChange: (status: CampaignStatusType) => void
      isPending?: boolean
    }

/** The status pill, doubling as the control that changes it. */
export function CampaignStatusControl({
  status,
  onChange,
  isPending,
  readOnly,
}: CampaignStatusControlProps) {
  const dot = <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />

  if (readOnly) {
    return (
      <span className={cn(STATUS_PILL_BASE, STATUS_PILL[status])}>
        {dot}
        {status}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          aria-label={`Campaign status: ${status}. Change status`}
          className={cn(
            STATUS_PILL_BASE,
            STATUS_PILL[status],
            // The pill is identical to the read-only badge, so it needs its own
            // affordances to read as a control: a ring on hover, a real focus ring,
            // and a chevron that flips while the menu is open.
            "group ring-1 ring-inset ring-transparent transition hover:ring-current/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {dot}
          {status}
          {/* Swapped for the chevron rather than added beside it — appending would
              change the pill's width mid-request and shift the heading next to it. */}
          {isPending ? (
            <Loader2 className="size-3 shrink-0 animate-spin" />
          ) : (
            <ChevronDown className="size-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={6} className="w-60">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Change status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {STATUS_ORDER.map((option) => {
          const isCurrent = option === status

          return (
            <DropdownMenuItem
              key={option}
              // Deliberately not `disabled`: the primitive fades disabled rows to 50%,
              // which would make the *current* status the faintest row in the menu.
              // It stays selectable and simply closes without firing a no-op request.
              onSelect={() => {
                if (!isCurrent) onChange?.(option)
              }}
              className={cn(
                "flex items-start gap-2.5 py-2",
                isCurrent ? "bg-accent/60" : "cursor-pointer"
              )}
            >
              <span
                className={cn("mt-[5px] size-2 shrink-0 rounded-full", STATUS_DOT[option])}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize">{option}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {STATUS_HINT[option]}
                </span>
              </span>
              {isCurrent && <Check className="mt-0.5 shrink-0 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

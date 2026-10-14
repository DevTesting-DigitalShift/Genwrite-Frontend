import { useState } from "react"
import type { ChangeEvent, ReactNode } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import {
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  X,
} from "lucide-react"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { FieldShell } from "../fields"
import { cn } from "@/lib/utils"

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

/** Toggle-pill group for picking several numbers (weekdays, days of the month). */
function PillPicker({
  name,
  label,
  options,
  grid,
}: {
  name: string
  label: string
  options: { value: number; label: string | number }[]
  /** Lay the pills out as a full-width, calendar-like 7-column grid. */
  grid?: boolean
}) {
  const { control } = useFormContext<FieldValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: number[] = field.value ?? []
        return (
          <FieldShell label={label} error={fieldState.error?.message}>
            <div
              className={cn(
                "rounded-xl",
                grid ? "grid grid-cols-7 gap-2" : "flex flex-wrap gap-2",
                fieldState.error && "border border-destructive p-2"
              )}
            >
              {options.map((option) => {
                const active = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      field.onChange(
                        active
                          ? selected.filter((v) => v !== option.value)
                          : [...selected, option.value]
                      )
                    }
                    className={cn(
                      "h-9 rounded-lg border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      grid ? "w-full" : "min-w-12 px-3",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </FieldShell>
        )
      }}
    />
  )
}

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily", hint: "Every day", icon: CalendarClock },
  { value: "weekdays", label: "Weekdays", hint: "Mon – Fri", icon: Briefcase },
  { value: "weekly", label: "Weekly", hint: "Days you pick", icon: CalendarDays },
  { value: "monthly", label: "Monthly", hint: "Dates you pick", icon: CalendarRange },
  { value: "custom", label: "Custom", hint: "Exact dates", icon: CalendarPlus },
] as const

const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")
  return `${n}${suffix}`
}

const listOf = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`

/** "Runs every Mon & Wed" — the schedule in words, or what's still missing from it. */
export function describeSchedule(schedule: {
  type: string
  daysOfWeek?: number[]
  daysOfMonth?: number[]
  customDates?: string[]
}): { text: string; complete: boolean } {
  const weekDays = [...(schedule.daysOfWeek ?? [])].sort((a, b) => a - b)
  const monthDays = [...(schedule.daysOfMonth ?? [])].sort((a, b) => a - b)
  const dates = schedule.customDates ?? []
  switch (schedule.type) {
    case "daily":
      return { text: "Runs every day", complete: true }
    case "weekdays":
      return { text: "Runs every weekday, Monday to Friday", complete: true }
    case "weekly":
      return weekDays.length
        ? { text: `Runs every ${listOf(weekDays.map((d) => WEEK_DAYS[d]))}`, complete: true }
        : { text: "Pick at least one day of the week", complete: false }
    case "monthly":
      return monthDays.length
        ? { text: `Runs on the ${listOf(monthDays.map(ordinal))} of each month`, complete: true }
        : { text: "Pick at least one date of the month", complete: false }
    case "custom":
      return dates.length
        ? {
            text: `Runs on ${dates.length} date${dates.length === 1 ? "" : "s"}, next ${dates[0]}`,
            complete: true,
          }
        : { text: "Add at least one date", complete: false }
    default:
      return { text: "Choose how often to run", complete: false }
  }
}

/**
 * Job schedule: how often (a row of option cards rather than a bare select, so every cadence
 * — including weekdays, which the backend supports — is visible at once), the days for the
 * cadences that need them, and the schedule read back in plain words. Changing the cadence
 * clears the other pickers' values and errors, so a stale weekly selection never rides along
 * with a monthly schedule.
 */
export function ScheduleFields({ footer }: { footer?: ReactNode }) {
  const { control, setValue, clearErrors } = useFormContext<FieldValues>()
  const schedule = useWatch({ control, name: "schedule" }) ?? { type: "daily" }
  const type: string = schedule.type
  const summary = describeSchedule(schedule)
  const perRun = Number(useWatch({ control, name: "numberOfBlogs" })) || 0

  return (
    <div className="space-y-5">
      <Controller
        control={control}
        name="schedule.type"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">How often should it run?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SCHEDULE_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = field.value === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (active) return
                      field.onChange(option.value)
                      setValue("schedule.daysOfWeek", [], { shouldDirty: true })
                      setValue("schedule.daysOfMonth", [], { shouldDirty: true })
                      setValue("schedule.customDates", [], { shouldDirty: true })
                      clearErrors([
                        "schedule.daysOfWeek",
                        "schedule.daysOfMonth",
                        "schedule.customDates",
                      ])
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <Icon
                      className={cn("size-4", active ? "text-primary" : "text-muted-foreground")}
                    />
                    <span className="text-sm font-semibold leading-none">{option.label}</span>
                    <span className="text-[11px] leading-none text-muted-foreground">
                      {option.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      />

      {type === "weekly" && (
        <PillPicker
          name="schedule.daysOfWeek"
          label="Days of the week"
          options={WEEK_DAYS.map((label, value) => ({ value, label }))}
          grid
        />
      )}

      {type === "monthly" && (
        <PillPicker
          name="schedule.daysOfMonth"
          label="Dates of the month"
          options={MONTH_DAYS.map((value) => ({ value, label: value }))}
          grid
        />
      )}

      {type === "custom" && <CustomDatesField />}

      {footer}

      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
          summary.complete
            ? "border-primary/15 bg-primary/5 text-foreground"
            : "border-dashed border-border bg-muted/30 text-muted-foreground"
        )}
      >
        <CalendarCheck
          className={cn("size-4 shrink-0", summary.complete ? "text-primary" : "")}
          aria-hidden
        />
        <span data-schedule-summary>
          {summary.text}
          {summary.complete && perRun > 0 && (
            <span className="text-muted-foreground">
              {" "}
              · {perRun} blog{perRun === 1 ? "" : "s"} per run
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

/** One date at a time, added to a chip list — the same picker-plus-chips shape as the tag fields. */
function CustomDatesField() {
  const { control } = useFormContext<FieldValues>()
  const [draft, setDraft] = useState("")

  return (
    <Controller
      control={control}
      name="schedule.customDates"
      render={({ field, fieldState }) => {
        const dates: string[] = field.value ?? []
        const today = new Date()
        const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

        const add = () => {
          if (!draft || draft < minimumDate || dates.includes(draft)) {
            setDraft("")
            return
          }
          field.onChange([...dates, draft].sort())
          setDraft("")
        }

        return (
          <FieldShell label="Dates" error={fieldState.error?.message}>
            <div className="flex gap-2">
              <Input
                type="date"
                min={minimumDate}
                value={draft}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                className="h-10 w-auto"
                aria-invalid={!!fieldState.error}
              />
              <Button type="button" variant="outline" onClick={add}>
                Add date
              </Button>
            </div>
            {dates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dates.map((date) => (
                  <Badge key={date} variant="secondary" className="gap-1">
                    {date}
                    <button
                      type="button"
                      aria-label={`Remove ${date}`}
                      onClick={() => field.onChange(dates.filter((d) => d !== date))}
                      className="ml-0.5 rounded-full hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </FieldShell>
        )
      }}
    />
  )
}

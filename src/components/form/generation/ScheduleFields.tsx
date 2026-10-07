import { useState } from "react"
import type { ChangeEvent } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { X } from "lucide-react"
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
}: {
  name: string
  label: string
  options: { value: number; label: string | number }[]
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
                "flex flex-wrap gap-2 rounded-md",
                fieldState.error && "border-2 border-destructive p-2"
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
                      "min-w-9 rounded-md px-2 py-1 text-sm transition-all",
                      active ? "bg-primary text-primary-foreground" : "bg-muted"
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

/**
 * Job schedule: a type picker plus whichever of weekdays / days of the month / custom dates
 * that type needs. Changing the type clears the other pickers' values and errors, so a
 * stale weekly selection never rides along with a monthly schedule.
 */
export function ScheduleFields() {
  const { control, setValue, clearErrors } = useFormContext<FieldValues>()
  const type = useWatch({ control, name: "schedule.type" })

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="schedule.type"
        render={({ field }) => (
          <FieldShell htmlFor="schedule-type" label="Schedule type">
            <select
              id="schedule-type"
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value)
                setValue("schedule.daysOfWeek", [], { shouldDirty: true })
                setValue("schedule.daysOfMonth", [], { shouldDirty: true })
                setValue("schedule.customDates", [], { shouldDirty: true })
                clearErrors(["schedule.daysOfWeek", "schedule.daysOfMonth", "schedule.customDates"])
              }}
              className="select select-bordered h-10 min-h-0 w-full text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </FieldShell>
        )}
      />

      {type === "weekly" && (
        <PillPicker
          name="schedule.daysOfWeek"
          label="Days of the week"
          options={WEEK_DAYS.map((label, value) => ({ value, label }))}
        />
      )}

      {type === "monthly" && (
        <PillPicker
          name="schedule.daysOfMonth"
          label="Dates of the month"
          options={MONTH_DAYS.map((value) => ({ value, label: value }))}
        />
      )}

      {type === "custom" && <CustomDatesField />}
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

        const add = () => {
          if (!draft || dates.includes(draft)) {
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
                value={draft}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                className="h-10 w-auto"
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

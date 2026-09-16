import type { ComponentType } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Checkbox as CheckboxUntyped } from "@components/ui/checkbox"
import { Label } from "@components/ui/label"
import { FieldShell } from "@components/form/fields"
import { cn } from "@/lib/utils"
import type { CampaignJobRef } from "@/types/campaign"

// See BlogMultiSelectField.tsx for why this cast exists — same untyped component.
const Checkbox = CheckboxUntyped as ComponentType<{
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}>

interface JobMultiSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  jobs: CampaignJobRef[]
  isLoading?: boolean
}

/** Checkbox list of jobs (posting-enabled only, filtered server-side) to link into a
 * campaign — its newly-created blogs get synced in daily while the job stays eligible. */
export function JobMultiSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  jobs,
  isLoading,
}: JobMultiSelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? []

        const toggle = (jobId: string) => {
          field.onChange(
            selected.includes(jobId) ? selected.filter((id) => id !== jobId) : [...selected, jobId]
          )
        }

        return (
          <FieldShell
            label="Jobs"
            description="Only jobs with a posting destination configured are listed — a job with posting off never produces anything Search Console can report on. New blogs from a linked job are added to this campaign daily, for as long as the job stays active and posting-enabled."
            error={fieldState.error?.message}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2">
                <span className="shrink-0 rounded-md border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {selected.length} selected
                </span>
              </div>

              <div className="space-y-0.5 overflow-x-hidden">
                {isLoading && <p className="p-3 text-sm text-muted-foreground">Loading jobs…</p>}
                {!isLoading && jobs.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">
                    No posting-enabled jobs yet. Turn on a posting destination for a job first —
                    then it can feed this campaign.
                  </p>
                )}
                {jobs.map((job) => (
                  <label
                    key={job._id}
                    htmlFor={`job-${job._id}`}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors",
                      selected.includes(job._id) ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                    )}
                  >
                    <Checkbox
                      id={`job-${job._id}`}
                      checked={selected.includes(job._id)}
                      onCheckedChange={() => toggle(job._id)}
                      className="shrink-0"
                    />
                    <Label htmlFor={`job-${job._id}`} className="min-w-0 flex-1 cursor-pointer truncate font-normal">
                      {job.name}
                    </Label>
                  </label>
                ))}
              </div>
            </div>
          </FieldShell>
        )
      }}
    />
  )
}

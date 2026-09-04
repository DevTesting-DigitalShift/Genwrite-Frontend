import { useFieldArray, useFormState } from "react-hook-form"
import type { Control, UseFormRegister } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { cn } from "@/lib/utils"
import type { CampaignFormValues } from "./campaignForm.schema"

interface KeywordTargetsFieldProps {
  control: Control<CampaignFormValues>
  register: UseFormRegister<CampaignFormValues>
}

/** Per-keyword target rows (keyword, target position, target clicks) — a useFieldArray
 * since it's a variable-length list, unlike the single-value RHF* field primitives. */
export function KeywordTargetsField({ control, register }: KeywordTargetsFieldProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "targets.keywords" })
  // Subscribed separately: `useFieldArray` reports the rows, not what's wrong with
  // them. Without this an empty keyword just made "Next" do nothing, with no
  // explanation anywhere on screen.
  const { errors } = useFormState({ control, name: "targets.keywords" })
  const rowErrors = errors.targets?.keywords

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Keyword targets</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ keyword: "", targetPosition: null, targetClicks: null })}
        >
          <Plus className="size-3.5" /> Add keyword
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No per-keyword targets yet — optional, if you've set one of the totals above.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => {
          const rowError = Array.isArray(rowErrors) ? rowErrors[index] : undefined

          return (
            <div key={field.id} className="space-y-1">
              <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                <Input
                  placeholder="Keyword"
                  aria-invalid={!!rowError?.keyword}
                  className={cn(rowError?.keyword && "border-destructive")}
                  {...register(`targets.keywords.${index}.keyword` as const)}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Target pos."
                  aria-invalid={!!rowError?.targetPosition}
                  className={cn(rowError?.targetPosition && "border-destructive")}
                  {...register(`targets.keywords.${index}.targetPosition` as const, {
                    setValueAs: (v) => (v === "" ? null : Number(v)),
                  })}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Target clicks"
                  aria-invalid={!!rowError?.targetClicks}
                  className={cn(rowError?.targetClicks && "border-destructive")}
                  {...register(`targets.keywords.${index}.targetClicks` as const, {
                    setValueAs: (v) => (v === "" ? null : Number(v)),
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove keyword target"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              {rowError && (
                <p className="text-xs text-destructive">
                  {rowError.keyword?.message ??
                    rowError.targetPosition?.message ??
                    rowError.targetClicks?.message}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

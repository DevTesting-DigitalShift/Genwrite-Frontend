import { useFieldArray } from "react-hook-form"
import type { Control, UseFormRegister } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import type { CampaignFormValues } from "./campaignForm.schema"

interface KeywordTargetsFieldProps {
  control: Control<CampaignFormValues>
  register: UseFormRegister<CampaignFormValues>
}

/** Per-keyword target rows (keyword, target position, target clicks) — a useFieldArray
 * since it's a variable-length list, unlike the single-value RHF* field primitives. */
export function KeywordTargetsField({ control, register }: KeywordTargetsFieldProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "targets.keywords" })

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
          No per-keyword targets yet — optional, on top of the aggregate targets above.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
            <Input
              placeholder="Keyword"
              {...register(`targets.keywords.${index}.keyword` as const)}
            />
            <Input
              type="number"
              min={1}
              placeholder="Target pos."
              {...register(`targets.keywords.${index}.targetPosition` as const, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
            <Input
              type="number"
              min={0}
              placeholder="Target clicks"
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
        ))}
      </div>
    </div>
  )
}

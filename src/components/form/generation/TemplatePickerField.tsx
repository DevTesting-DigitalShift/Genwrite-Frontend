import { useCallback, useState } from "react"
import { get, useFormContext, useFormState, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Crown, X } from "lucide-react"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import type { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { packages } from "@/data/templates"
import useAuthStore from "@store/useAuthStore"
import { cn } from "@/lib/utils"

interface TemplatePickerFieldProps {
  /** Single-template forms store a string; multi-template forms (bulk, job) an array. */
  mode: "single" | "multiple"
  /** Form field holding the template name(s): `template` or `templates`. */
  name: "template" | "templates"
  /** How many may be picked in `multiple` mode. */
  max?: number
}

const sameList = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const RESTRICTED_MESSAGE = "Please upgrade to a Pro subscription or more to access this template."

/**
 * Template grid bound to the form. The grid tracks selection by numeric id, so the ids live
 * in a form-only `templateIds` field next to the name(s) the API actually receives.
 *
 * The image-card grid (`TemplateSelection`) needs real width to read as a grid rather than a
 * single scrolling list of thumbnails, so it only renders from `md` up. Below that, a compact
 * select (single mode) or a checklist popover (multiple) does the same job without the images.
 *
 * `handleSelect` re-runs on every render `TemplateSelection`'s `onClick` effect fires, so it
 * must be stable and must not write (or re-validate) when nothing changed — otherwise showing
 * an error would loop through validation forever.
 */
export function TemplatePickerField({ mode, name, max = 1 }: TemplatePickerFieldProps) {
  const { control, setValue, getValues, getFieldState } = useFormContext<FieldValues>()
  const plan = useAuthStore((s) => s.user?.subscription?.plan) ?? "free"
  const isProUser = !["free", "basic"].includes(plan.toLowerCase())
  const templateIds = (useWatch({ control, name: "templateIds" }) as number[] | undefined) ?? []
  const { errors } = useFormState({ control })
  const error = (get(errors, name)?.message ?? get(errors, "templateIds")?.message) as
    | string
    | undefined

  const commit = useCallback(
    (ids: number[]) => {
      const templates = ids.flatMap((id) => packages.find((p) => p.id === id) ?? [])
      const names = templates.map((t) => t.name)
      const nextName = mode === "single" ? (names[0] ?? null) : names

      if (!sameList(getValues(name), nextName)) {
        setValue(name, nextName, {
          shouldDirty: true,
          // Only re-check once the user is already looking at an error for this field.
          shouldValidate: !!getFieldState(name).error,
        })
      }
      if (!sameList(getValues("templateIds"), ids)) {
        setValue("templateIds", ids, { shouldDirty: true })
      }
    },
    [mode, name, getValues, setValue, getFieldState]
  )

  const handleSelect = useCallback(
    (templates: BlogTemplate[]) => commit(templates.map((t) => t.id)),
    [commit]
  )

  return (
    // A field shell like every RHF field, so a failed submit can name and focus the picker.
    <div
      data-field-shell
      data-field-label={mode === "single" ? "Template" : "Templates"}
      className="space-y-2"
    >
      <div className="hidden md:block">
        <TemplateSelection
          userSubscriptionPlan={plan}
          numberOfSelection={mode === "single" ? 1 : max}
          preSelectedIds={templateIds}
          error={error}
          onClick={handleSelect}
          compact
        />
      </div>
      <div className="md:hidden">
        {mode === "single" ? (
          <CompactSingleTemplatePicker
            selectedId={templateIds[0]}
            isProUser={isProUser}
            error={error}
            onSelect={(id) => commit([id])}
          />
        ) : (
          <CompactMultiTemplatePicker
            selectedIds={templateIds}
            max={max}
            isProUser={isProUser}
            error={error}
            onChange={commit}
          />
        )}
      </div>
    </div>
  )
}

function restrictionError(isProUser: boolean, templateId: number) {
  const template = packages.find((p) => p.id === templateId)
  return !isProUser && template?.paid ? RESTRICTED_MESSAGE : null
}

function CompactSingleTemplatePicker({
  selectedId,
  isProUser,
  error,
  onSelect,
}: {
  selectedId: number | undefined
  isProUser: boolean
  error?: string
  onSelect: (id: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Select
        value={selectedId !== undefined ? String(selectedId) : ""}
        onValueChange={(value: string) => {
          const id = Number(value)
          const problem = restrictionError(isProUser, id)
          if (problem) {
            toast.error(problem)
            return
          }
          onSelect(id)
        }}
      >
        <SelectTrigger className={cn("h-11", error && "border-destructive")}>
          <SelectValue placeholder="Choose a template" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {packages.map((template) => (
            <SelectItem key={template.id} value={String(template.id)}>
              <span className="flex items-center gap-2">
                {template.name}
                {template.paid && !isProUser && <Crown className="size-3 text-amber-500" />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function CompactMultiTemplatePicker({
  selectedIds,
  max,
  isProUser,
  error,
  onChange,
}: {
  selectedIds: number[]
  max: number
  isProUser: boolean
  error?: string
  onChange: (ids: number[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = selectedIds.flatMap((id) => packages.find((p) => p.id === id) ?? [])

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id))
      return
    }
    const problem = restrictionError(isProUser, id)
    if (problem) {
      toast.error(problem)
      return
    }
    if (selectedIds.length >= max) {
      toast.error(`You can select a maximum of ${max} templates.`)
      return
    }
    onChange([...selectedIds, id])
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between font-normal",
              error && "border-destructive",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            {selected.length > 0
              ? `${selected.length} template${selected.length > 1 ? "s" : ""} selected`
              : "Choose templates"}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
          <div className="max-h-64 overflow-y-auto">
            {packages.map((template) => {
              const checked = selectedIds.includes(template.id)
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => toggle(template.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="flex-1 text-left">{template.name}</span>
                  {template.paid && !isProUser && <Crown className="size-3 text-amber-500" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((template) => (
            <Badge key={template.id} variant="secondary" className="gap-1">
              {template.name}
              <button
                type="button"
                aria-label={`Remove ${template.name}`}
                onClick={() => toggle(template.id)}
                className="ml-0.5 rounded-full hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Switch } from "@components/ui/switch"
import { Label } from "@components/ui/label"
import { cn } from "@/lib/utils"

interface RHFSwitchFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

/** Generic boolean toggle wired to react-hook-form — the "auto suggest / auto apply" style field. */
export function RHFSwitchField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: RHFSwitchFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("flex items-center justify-between gap-4 py-1", className)}>
          <div className="space-y-0.5">
            <Label htmlFor={name} className="cursor-pointer">
              {label}
            </Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <Switch
            id={name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </div>
      )}
    />
  )
}

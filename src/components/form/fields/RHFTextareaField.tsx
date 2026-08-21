import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Textarea } from "@components/ui/textarea"
import { FieldShell } from "./FieldShell"

interface RHFTextareaFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
  className?: string
}

/** Generic multi-line textarea wired to react-hook-form. Reusable across any form. */
export function RHFTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder,
  rows = 3,
  className,
}: RHFTextareaFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          htmlFor={name}
          label={label}
          required={required}
          description={description}
          error={fieldState.error?.message}
          className={className}
        >
          <Textarea
            id={name}
            rows={rows}
            className="resize-none"
            placeholder={placeholder}
            aria-invalid={!!fieldState.error}
            {...field}
            value={field.value ?? ""}
          />
        </FieldShell>
      )}
    />
  )
}

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Input } from "@components/ui/input"
import { FieldShell } from "./FieldShell"

interface RHFTextFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  type?: string
  className?: string
}

/** Generic single-line text/url/email input wired to react-hook-form. Reusable across any form. */
export function RHFTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder,
  type = "text",
  className,
}: RHFTextFieldProps<TFieldValues>) {
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
          <Input
            id={name}
            type={type}
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

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import type { ChangeEvent } from "react"
import { Input } from "@components/ui/input"
import { FieldShell } from "./FieldShell"

interface RHFNumberFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  /** The field stores `null` for "no value" (e.g. an unset target) rather than 0. */
  nullable?: boolean
  /** Render the label and the input on one row rather than stacked. */
  inline?: boolean
  className?: string
}

/**
 * Generic numeric input wired to react-hook-form. Empty string round-trips to
 * `null` (nullable) or `undefined` so optional numeric targets don't coerce to 0.
 */
export function RHFNumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder,
  min,
  max,
  step,
  nullable = false,
  inline,
  className,
}: RHFNumberFieldProps<TFieldValues>) {
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
          inline={inline}
          className={className}
        >
          <Input
            id={name}
            type="number"
            className={inline ? "w-24 text-center" : undefined}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            aria-invalid={!!fieldState.error}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value
              if (raw === "") {
                field.onChange(nullable ? null : undefined)
                return
              }
              field.onChange(Number(raw))
            }}
          />
        </FieldShell>
      )}
    />
  )
}

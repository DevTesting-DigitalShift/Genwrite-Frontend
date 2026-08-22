import { useState } from "react"
import type { ComponentType, ReactNode } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import dayjs from "dayjs"
import { CalendarIcon } from "lucide-react"
import {
  Popover,
  PopoverContent as PopoverContentUntyped,
  PopoverTrigger,
} from "@components/ui/popover"
import { Calendar as CalendarUntyped } from "@components/ui/calendar"
import { cn } from "@/lib/utils"
import { FieldShell } from "./FieldShell"

// `Calendar` and `PopoverContent` are plain JSX (untyped) components — cast once so the
// call sites below get real prop checking instead of TS collapsing them to `RefAttributes<any>`.
const PopoverContent = PopoverContentUntyped as ComponentType<{
  children?: ReactNode
  align?: "start" | "center" | "end"
  className?: string
}>

const Calendar = CalendarUntyped as ComponentType<{
  mode?: "single"
  selected?: Date
  onSelect?: (date?: Date) => void
  defaultMonth?: Date
  disabled?: { before?: Date; after?: Date }
  startMonth?: Date
  autoFocus?: boolean
  className?: string
}>

const VALUE_FORMAT = "YYYY-MM-DD"

interface RHFDateFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  /** How the chosen date reads in the trigger. The stored value is always YYYY-MM-DD. */
  displayFormat?: string
  /** Earliest selectable day (YYYY-MM-DD or Date). Everything before it is disabled. */
  minDate?: string | Date | null
  /** Latest selectable day (YYYY-MM-DD or Date). Everything after it is disabled. */
  maxDate?: string | Date | null
  className?: string
}

/** Normalises a bound to the start of its day, or undefined when unset/unparseable. */
function toBound(value?: string | Date | null): Date | undefined {
  if (!value) return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.startOf("day").toDate() : undefined
}

/**
 * Date input wired to react-hook-form, backed by the app's own Calendar popover.
 * Deliberately not `<input type="date">` — that renders the browser's native picker,
 * which ignores the product's theme and looks different on every OS.
 */
export function RHFDateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder = "Select a date",
  displayFormat = "DD MMM YYYY",
  minDate,
  maxDate,
  className,
}: RHFDateFieldProps<TFieldValues>) {
  const [open, setOpen] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const parsed = field.value ? dayjs(field.value as string) : null
        const selected = parsed?.isValid() ? parsed.toDate() : undefined
        const min = toBound(minDate)
        const max = toBound(maxDate)

        return (
          <FieldShell
            htmlFor={name}
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message}
            className={className}
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  id={name}
                  type="button"
                  aria-invalid={!!fieldState.error}
                  onBlur={field.onBlur}
                  className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                    "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "aria-invalid:border-destructive",
                    !selected && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selected ? dayjs(selected).format(displayFormat) : placeholder}
                  </span>
                  <CalendarIcon className="size-4 shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selected}
                  defaultMonth={selected ?? min}
                  disabled={{ before: min, after: max }}
                  autoFocus
                  onSelect={(date?: Date) => {
                    field.onChange(date ? dayjs(date).format(VALUE_FORMAT) : "")
                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </FieldShell>
        )
      }}
    />
  )
}

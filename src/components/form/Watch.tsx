import type { ReactNode } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"

/**
 * Renders `children` with the current value of one field and re-renders only when that field
 * changes. Lets a form show or dim something based on a switch without watching every value
 * at its root (which would re-render every section on each keystroke).
 */
export function Watch<TValue = unknown>({
  name,
  children,
}: {
  name: string
  children: (value: TValue) => ReactNode
}) {
  const { control } = useFormContext<FieldValues>()
  const value = useWatch({ control, name }) as TValue
  return <>{children(value)}</>
}

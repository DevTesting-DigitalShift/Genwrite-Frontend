import { Controller, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import AiModelSelector from "@components/AiModelSelector"

/** Model cards + cost-cutter switch, bound to `aiModel` and `costCutter`. */
export function AiModelFields() {
  const { control } = useFormContext<FieldValues>()

  return (
    <Controller
      control={control}
      name="aiModel"
      render={({ field, fieldState }) => (
        <Controller
          control={control}
          name="costCutter"
          render={({ field: costCutter }) => (
            <AiModelSelector
              value={field.value}
              onChange={field.onChange}
              showCostCutter
              costCutterValue={!!costCutter.value}
              onCostCutterChange={costCutter.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  )
}

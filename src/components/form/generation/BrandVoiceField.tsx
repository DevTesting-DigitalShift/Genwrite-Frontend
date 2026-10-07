import { useWatch, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"

/**
 * Brand-voice block for every generation form. `BrandVoiceSelector` speaks one combined
 * object, so this maps it onto the canonical form keys: `isCheckedBrand`, `brandId`,
 * `options.addCTA` and `options.createBrandedImages`.
 */
export function BrandVoiceField({ label = "Write with brand voice" }: { label?: string }) {
  const { control, setValue, formState } = useFormContext<FieldValues>()
  const [isCheckedBrand, brandId, addCTA, createBrandedImages, imageSource] = useWatch({
    control,
    name: [
      "isCheckedBrand",
      "brandId",
      "options.addCTA",
      "options.createBrandedImages",
      "imageSource",
    ],
  })
  const brandError = formState.errors.brandId?.message as string | undefined

  return (
    <div className="space-y-1">
      <BrandVoiceSelector
        label={label}
        labelClass="text-sm font-semibold"
        value={{
          isCheckedBrand: !!isCheckedBrand,
          brandId: brandId ?? "",
          addCTA: !!addCTA,
          createBrandedImages: !!createBrandedImages,
        }}
        imageSource={imageSource}
        onChange={(next) => {
          const opts = { shouldDirty: true, shouldValidate: !!brandError }
          setValue("isCheckedBrand", next.isCheckedBrand, opts)
          setValue("brandId", next.isCheckedBrand ? next.brandId || null : null, opts)
          setValue("options.addCTA", next.addCTA, { shouldDirty: true })
          // Branded images only exist for a brand voice with AI imagery.
          setValue("options.createBrandedImages", next.isCheckedBrand && next.createBrandedImages, {
            shouldDirty: true,
          })
        }}
      />
      {brandError && <p className="text-xs text-destructive">{brandError}</p>}
    </div>
  )
}

import { useEffect } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { brandsQuery } from "@api/Brand/Brand.query"
import type { Brand } from "@/types/brand"
import { Button } from "@components/ui/button"
import { Switch } from "@components/ui/switch"
import { IMAGE_SOURCE } from "@/data/blogData"
import { DependentFields } from "../DependentFields"
import { FieldShell, fieldErrorId, RHFSwitchField } from "../fields"

/** Image sources the backend can brand (see the job validator's `createBrandedImages` rule). */
export const BRANDABLE_IMAGE_SOURCES: readonly string[] = [IMAGE_SOURCE.AI, IMAGE_SOURCE.UPLOAD]

const ROW = "px-3.5 py-3"

/**
 * Brand voice for every generation form, bound to `isCheckedBrand`, `brandId`,
 * `options.addCTA` and `options.createBrandedImages`.
 *
 * The brand picker and the CTA / branded-image switches only mean something with a brand
 * applied, so they sit under it — always shown, dimmed until it's on (turning it on picks the
 * first brand). "Create branded images" used to vanish unless the image source happened to be
 * AI, which read as a missing feature; it's now always listed, and disabled with the reason
 * (and reset) while the images can't be branded.
 */
export function BrandVoiceField() {
  const navigate = useNavigate()
  const { control, setValue, clearErrors } = useFormContext<FieldValues>()
  const { data: brands = [], isLoading, isError } = brandsQuery.useList()
  const [isCheckedBrand, imageSource, createBrandedImages] = useWatch({
    control,
    name: ["isCheckedBrand", "imageSource", "options.createBrandedImages"],
  })
  const canBrandImages = BRANDABLE_IMAGE_SOURCES.includes(imageSource)

  // Branded images can't ride along with a brand that's off or images that can't be branded.
  useEffect(() => {
    if (createBrandedImages && (!isCheckedBrand || !canBrandImages)) {
      setValue("options.createBrandedImages", false, { shouldDirty: true })
    }
  }, [createBrandedImages, isCheckedBrand, canBrandImages, setValue])

  const noBrands = !isLoading && !isError && brands.length === 0

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="isCheckedBrand"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="isCheckedBrand" className="text-sm font-semibold">
                Write with brand voice
              </label>
              <p className="text-xs text-muted-foreground">
                {isError
                  ? "Couldn't load your brand voices. Try again in a moment."
                  : "Apply a saved brand's tone, terminology and style."}
              </p>
            </div>
            <Switch
              id="isCheckedBrand"
              size="large"
              checked={!!field.value}
              disabled={isLoading || isError || noBrands}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                setValue("brandId", checked ? (brands[0]?._id ?? null) : null, {
                  shouldDirty: true,
                })
                if (!checked) {
                  setValue("options.addCTA", false, { shouldDirty: true })
                  clearErrors("brandId")
                }
              }}
            />
          </div>
        )}
      />

      {noBrands && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">No brand voice yet</p>
            <p className="text-xs text-muted-foreground">Create one to keep every blog on-brand.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/brand-voice")}
          >
            Create brand voice
          </Button>
        </div>
      )}

      <DependentFields enabled={!!isCheckedBrand}>
        <Controller
          control={control}
          name="brandId"
          render={({ field, fieldState }) => (
            <FieldShell
              htmlFor="brandId"
              label="Brand voice"
              required
              error={fieldState.error?.message}
            >
              <select
                id="brandId"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                onBlur={field.onBlur}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? fieldErrorId("brandId") : undefined}
                className="select select-bordered h-10 min-h-0 w-full rounded-lg text-sm aria-invalid:border-destructive"
              >
                {!field.value && <option value="">Select a brand voice</option>}
                {brands.map((brand: Brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.nameOfVoice}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
        />

        <div className="divide-y divide-border rounded-xl border border-border">
          <RHFSwitchField
            control={control}
            name="options.addCTA"
            label="Add a call to action"
            description="End the post with a call to action in your brand's voice."
            className={ROW}
          />
          <RHFSwitchField
            control={control}
            name="options.createBrandedImages"
            label="Create branded images"
            description={
              canBrandImages
                ? "Add your brand's logo and style to the blog's images."
                : "Needs AI-generated or uploaded images — choose one under AI & images."
            }
            disabled={!canBrandImages}
            className={ROW}
          />
        </div>
      </DependentFields>
    </div>
  )
}

import { brandsQuery } from "@api/Brand/Brand.query"
import type { Brand } from "@/types/brand"
import React, { FC, useEffect, useState } from "react"
import { toast } from "sonner"
import clsx from "clsx"
import { Switch } from "@components/ui/switch"

interface BrandVoiceSelectorProps {
  label: string
  labelClass?: string
  value?: { isCheckedBrand: boolean; brandId: string; addCTA: boolean }
  onChange?: (updated: { isCheckedBrand: boolean; brandId: string; addCTA: boolean }) => void
}

const BrandVoiceSelector: FC<BrandVoiceSelectorProps> = ({
  label,
  labelClass,
  value = { isCheckedBrand: false, brandId: "", addCTA: false },
  onChange,
}) => {
  const [state, setState] = useState(value)
  /** ✅ Fetch brand voices from API */
  const { data: brands = [], isLoading, error } = brandsQuery.useList()

  // Sync state when value prop changes from parent
  useEffect(() => {
    setState(value)
  }, [value])

  const handleUpdate = (updates: Partial<typeof state>) => {
    const newState = { ...state, ...updates }
    setState(newState)
    onChange?.(newState)
  }

  /** Toggle Brand Voice section */
  const handleBrandToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (error) {
      toast.error("Brand Fetching Error, please try after some time.")
      console.error(error)
    } else if (checked && (!brands || brands.length === 0)) {
      toast.error("No brand voices available. Create one to enable this option.")
    } else {
      handleUpdate({
        isCheckedBrand: checked,
        brandId: checked ? state.brandId || (brands[0]?._id ?? "") : "",
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center form-item-wrapper">
        <div>
          <label htmlFor={`blog-isCheckedBrand`} className={clsx(labelClass)}>
            {label}
          </label>
          <p className="text-xs text-gray-500">Apply your brand's unique tone and style</p>
        </div>
        <Switch
          id="blog-isCheckedBrand"
          size="large"
          checked={state.isCheckedBrand}
          onCheckedChange={(checked: boolean) => {
            handleBrandToggle({ target: { checked } } as any)
          }}
          disabled={isLoading || !brands || brands.length === 0}
        />
      </div>

      {state.isCheckedBrand && (
        <div className="flex flex-col gap-2 transition-all py-4 rounded-lg">
          <label className={clsx(labelClass, "text-sm font-semibold")}>Select Brand Voice</label>

          <select
            className="select select-bordered w-full rounded-[10px] text-sm h-10 min-h-0 focus:outline-none"
            value={state.brandId || ""}
            onChange={e => handleUpdate({ brandId: e.target.value })}
          >
            {brands.map((brand: Brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.nameOfVoice}
              </option>
            ))}
          </select>
        </div>
      )}

      {state.isCheckedBrand && (
        <div className="flex justify-between items-center mt-2 pl-1">
          <div>
            <label htmlFor="blog-brand-add-cta" className={clsx(labelClass)}>
              Add CTA at the End
            </label>
            <p className="text-xs text-gray-500">Include a call-to-action to engage audience</p>
          </div>
          <Switch
            id="blog-brand-add-cta"
            size="large"
            checked={state.addCTA}
            onCheckedChange={(checked: boolean) => handleUpdate({ addCTA: checked })}
          />
        </div>
      )}
    </div>
  )
}

export default BrandVoiceSelector

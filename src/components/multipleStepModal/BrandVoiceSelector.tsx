import { brandsQuery } from "@api/Brand/Brand.query"
import type { Brand } from "@/types/brand"
import React, { FC, useEffect, useMemo, useState } from "react"
import toast from "@utils/toast"
import clsx from "clsx"

interface BrandVoiceSelectorProps {
  label: string
  labelClass?: string
  value?: { isCheckedBrand: boolean; brandId: string; addCTA: boolean }
  onChange?: (updated: { isCheckedBrand: boolean; brandId: string; addCTA: boolean }) => void
  errorText?: string
  size?: "small" | "default" | "large"
}

const BrandVoiceSelector: FC<BrandVoiceSelectorProps> = ({
  label,
  labelClass,
  value = { isCheckedBrand: false, brandId: "", addCTA: false },
  onChange,
  errorText,
  size = "small",
}) => {
  const [state, setState] = useState(value)
  const formError = useMemo(() => errorText, [errorText])
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
      handleUpdate({ isCheckedBrand: checked, brandId: checked ? state.brandId : "" })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center form-item-wrapper">
        <label htmlFor={`blog-isCheckedBrand`} className={clsx(labelClass)}>
          {label}
        </label>
        <input
          type="checkbox"
          id={`blog-isCheckedBrand`}
          className={clsx(
            "toggle toggle-primary",
            size === "small" && "toggle-sm",
            size === "large" && "toggle-md"
          )}
          checked={state.isCheckedBrand}
          onChange={handleBrandToggle}
          disabled={isLoading || !brands || brands.length === 0}
        />
      </div>

      {state.isCheckedBrand && (
        <div
          className={clsx(
            "flex flex-col gap-2 transition-all p-2 rounded-lg",
            formError && "border border-red-500 bg-red-50"
          )}
        >
          <label className={clsx(formError ? "text-red-500" : labelClass, "text-sm font-semibold")}>
            {formError ? formError : "Select Brand Voice"}
          </label>

          <div
            className="w-full h-[200px] overflow-y-auto p-1 space-y-2 border border-gray-300 p-3 rounded-md bg-base-100"
            style={{ scrollbarWidth: "thin", scrollBehavior: "smooth" }}
          >
            {brands.map((brand: Brand) => (
              <div
                key={brand._id}
                onClick={() => handleUpdate({ brandId: brand._id })}
                className={clsx(
                  "cursor-pointer p-3 border rounded-lg transition-all hover:shadow-sm",
                  state.brandId === brand._id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="brandId"
                    className="radio radio-primary radio-sm mt-1"
                    checked={state.brandId === brand._id}
                    onChange={() => handleUpdate({ brandId: brand._id })}
                  />
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-montserrat font-medium uppercase truncate text-sm">
                      {brand.nameOfVoice}
                    </span>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-tight">
                      {brand.describeBrand}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {brands.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No brands found.</div>
            )}
          </div>
        </div>
      )}

      {state.isCheckedBrand && (
        <div className="flex justify-between items-center mt-2 pl-1">
          <label htmlFor="blog-brand-add-cta" className={clsx(labelClass)}>
            Add CTA at the End
          </label>
          <input
            type="checkbox"
            id="blog-brand-add-cta"
            className={clsx(
              "toggle toggle-primary",
              size === "small" && "toggle-sm",
              size === "large" && "toggle-md"
            )}
            checked={state.addCTA}
            onChange={e => handleUpdate({ addCTA: e.target.checked })}
          />
        </div>
      )}
    </div>
  )
}

export default BrandVoiceSelector

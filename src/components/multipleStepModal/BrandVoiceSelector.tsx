import { brandsQuery } from "@api/Brand/Brand.query"
import type { Brand } from "@/types/brand"
import { Flex, message, Switch, Typography, Radio, Space, Card } from "antd"
import React, { FC, useEffect, useMemo, useState } from "react"
import clsx from "clsx"

interface BrandVoiceSelectorProps {
  label: string
  labelClass?: string
  value?: {
    isCheckedBrand: boolean
    brandId: string
    addCTA: boolean
  }
  onChange?: (updated: { isCheckedBrand: boolean; brandId: string; addCTA: boolean }) => void
  errorText?: string
}

const { Text, Paragraph } = Typography

const BrandVoiceSelector: FC<BrandVoiceSelectorProps> = ({
  label,
  labelClass,
  value = { isCheckedBrand: false, brandId: "", addCTA: false },
  onChange,
  errorText,
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
  const handleBrandToggle = (checked: boolean) => {
    if (error) {
      message.error("Brand Fetchin Error, please try after some time.")
      console.error(error)
    } else if (checked && (!brands || brands.length === 0)) {
      message.warning("No brand voices available. Create one to enable this option.")
    } else {
      handleUpdate({
        isCheckedBrand: checked,
        brandId: checked ? state.brandId : "",
      })
    }
  }

  return (
    <>
      <Flex vertical gap={8}>
        <Flex justify="space-between" className="form-item-wrapper">
          <label htmlFor={`blog-isCheckedBrand`} className={clsx(labelClass)}>
            {label}
          </label>
          <Switch
            size="small"
            id={`blog-isCheckedBrand`}
            checked={state.isCheckedBrand}
            onChange={handleBrandToggle}
            disabled={isLoading || !brands || brands.length === 0}
          />
        </Flex>

        <Flex
          vertical
          gap={4}
          hidden={!state.isCheckedBrand}
          className={clsx(formError && "p-1 rounded-lg border !border-red-500")}
        >
          <label className={clsx(formError && "text-red-500", labelClass)}>
            {formError ? formError : "Select Brand Voice"}
          </label>
          <Radio.Group
            onChange={e => handleUpdate({ brandId: e.target.value })}
            value={state.brandId}
            className="w-full"
          >
            <Space
              direction="vertical"
              className="w-full h-[200px] overflow-y-auto p-2"
              style={{
                scrollbarWidth: "thin",
                scrollBehavior: "smooth",
              }}
            >
              {brands.map((brand: Brand) => (
                <Card
                  key={brand._id}
                  size="small"
                  hoverable
                  className={clsx(
                    "transition-all border mt-2 hover:ring-2 hover:ring-purple-500",
                    state.brandId === brand._id ? "border-blue-500 bg-blue-50" : "border-gray-400"
                  )}
                >
                  <Radio value={brand._id}>
                    <Space direction="vertical" size={2}>
                      <Text className="font-montserrat font-medium uppercase line-clamp-1">
                        {brand.nameOfVoice}
                      </Text>
                      <Paragraph
                        type="secondary"
                        style={{ marginBottom: 0 }}
                        ellipsis={{ rows: 2, expandable: false }}
                      >
                        {brand.describeBrand}
                      </Paragraph>
                    </Space>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        </Flex>

        <Flex justify="space-between" hidden={!state.isCheckedBrand} className="!mt-4">
          <label htmlFor="blog-brand-add-cta" className={clsx(labelClass)}>
            Add CTA at the End
          </label>
          <Switch
            size="small"
            id="blog-brand-add-cta"
            checked={state.addCTA}
            onChange={checked => handleUpdate({ addCTA: checked })}
          />
        </Flex>
      </Flex>
    </>
  )
}

export default BrandVoiceSelector

import { useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { aiSectionSummary } from "@/forms/shared/summary"
import { FormSection } from "../FormSection"
import { AiModelFields } from "./AiModelFields"
import { ImageSettingsFields } from "./ImageSettingsFields"

/**
 * "AI & images" — the model, the cost cutter and the blog's images in one section, the same
 * in the advanced, bulk and job forms: together they decide most of what a blog costs.
 * Only the advanced blog can upload its own images (`allowUpload`).
 */
export function AiImagesSection({ step, allowUpload }: { step: number; allowUpload?: boolean }) {
  const { control } = useFormContext<FieldValues>()
  const [aiModel, costCutter, imageSource, numberOfImages, blogImages] = useWatch({
    control,
    name: ["aiModel", "costCutter", "imageSource", "numberOfImages", "blogImages"],
  })

  return (
    <FormSection
      id="ai"
      step={step}
      title="AI & images"
      description="Model, cost cutter and the blog's images"
      summary={aiSectionSummary({ aiModel, costCutter, imageSource, numberOfImages, blogImages })}
      fields={["aiModel", "costCutter", "imageSource", "numberOfImages", "blogImages"]}
    >
      <AiModelFields />
      <ImageSettingsFields allowUpload={allowUpload} />
    </FormSection>
  )
}

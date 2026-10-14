import { useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { Palette, PenLine, Search, Send } from "lucide-react"
import type { GenerationOptionKey } from "@/forms/shared/options"
import { ConfigTabs } from "../ConfigTabs"
import type { ConfigTab } from "../ConfigTabs"
import { FormSection } from "../FormSection"
import { ToggleListField } from "../ToggleListField"
import type { ExtraToggle } from "../ToggleListField"
import { BrandVoiceField } from "./BrandVoiceField"
import { PostingFields } from "./PostingFields"

const WRITING_KEYS: readonly GenerationOptionKey[] = [
  "easyToUnderstand",
  "humanisation",
  "extendedThinking",
  "deepResearch",
]
const SEO_KEYS: readonly GenerationOptionKey[] = [
  "includeFaqs",
  "includeInterlinks",
  "addOutBoundLinks",
  "includeCompetitorResearch",
  "embedYouTubeVideos",
]

/**
 * The "Advanced configuration" section the advanced, bulk and job forms end with — the same
 * four tabs in all three: writing quality, SEO & content, brand voice and publishing, as tabs
 * of one card instead of a stack of sections. (Images live with the model in "AI & images",
 * since both drive the cost; quick and YouTube blogs have no advanced settings at all.)
 * Badges, error routing and the section's summary are worked out here so they can't drift.
 */
export function AdvancedConfigSection({
  step,
  seoExtra,
}: {
  step: number
  /** SEO & content switches that aren't `options.*` keys (the advanced blog's quick summary). */
  seoExtra?: ExtraToggle[]
}) {
  const writing = WRITING_KEYS
  const seo = SEO_KEYS
  const { control } = useFormContext<FieldValues>()
  // Only what the badges read — watching every value would re-render this on each keystroke.
  const extraNames = (seoExtra ?? []).map((t) => t.name)
  const [options, isCheckedBrand, ...extraValues] = useWatch({
    control,
    name: ["options", "isCheckedBrand", ...extraNames],
  }) as [Record<string, boolean> | undefined, boolean | undefined, ...unknown[]]
  const on = (key: string) => !!options?.[key]

  const writingCount = writing.filter(on).length
  const seoCount = seo.filter(on).length + extraValues.filter(Boolean).length
  const brandOn = !!isCheckedBrand
  const postingOn = on("automaticPosting")

  const tabs: ConfigTab[] = [
    {
      id: "writing",
      label: "Writing",
      icon: PenLine,
      badge: writingCount || undefined,
      content: <ToggleListField keys={writing} />,
    },
    {
      id: "seo",
      label: "SEO & content",
      icon: Search,
      badge: seoCount || undefined,
      content: <ToggleListField keys={seo} extra={seoExtra} />,
    },
    {
      id: "brand",
      label: "Brand voice",
      icon: Palette,
      badge: brandOn ? "On" : undefined,
      fields: ["brandId"],
      content: <BrandVoiceField />,
    },
    {
      id: "publishing",
      label: "Publishing",
      icon: Send,
      badge: postingOn ? "On" : undefined,
      fields: ["postingDefaultType"],
      content: <PostingFields />,
    },
  ]

  const active = writingCount + seoCount + [brandOn, postingOn].filter(Boolean).length

  return (
    <FormSection
      id="advanced"
      step={step}
      title="Advanced configuration"
      description={tabs.map((tab) => tab.label).join(", ")}
      summary={active ? `${active} active` : "Defaults"}
      fields={tabs.flatMap((tab) => tab.fields ?? [])}
      flush
    >
      <ConfigTabs tabs={tabs} />
    </FormSection>
  )
}

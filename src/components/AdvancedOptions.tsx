import React from "react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

export interface AdvancedOptionsData {
  extendedThinking?: boolean
  deepResearch?: boolean
  humanisation?: boolean
  tone?: string
  userDefinedLength?: number
  includeFaqs?: boolean
  includeInterlinks?: boolean
  embedYouTubeVideos?: boolean
  includeCompetitorResearch?: boolean
  addOutBoundLinks?: boolean
  easyToUnderstand?: boolean
  [key: string]: any
}

interface AdvancedOptionsProps {
  formData: any
  updateFormData: (data: any) => void
  showFields?: string[]
  isNestedOptions?: boolean // Whether to access via formData.options[key]
  labelClass?: string
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  formData,
  updateFormData,
  showFields,
  isNestedOptions = false,
  labelClass = "text-sm font-semibold",
}) => {
  const isFieldVisible = (field: string) => !showFields || showFields.includes(field)

  const getFieldValue = (path: string) => {
    if (isNestedOptions) {
      return formData.options?.[path]
    }
    return formData[path]
  }

  const setFieldValue = (path: string, value: any) => {
    if (isNestedOptions) {
      updateFormData({ options: { ...formData.options, [path]: value } })
    } else {
      updateFormData({ [path]: value })
    }
  }

  const renderOptionRow = (
    label: string,
    id: string,
    content: React.ReactNode,
    description?: string
  ) => {
    if (!isFieldVisible(id)) return null

    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <label className={labelClass}>{label}</label>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center">{content}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Easy to Understand */}
      {renderOptionRow(
        "Easy to Understand",
        "easyToUnderstand",
        <Switch
          checked={getFieldValue("easyToUnderstand") || false}
          onCheckedChange={val => setFieldValue("easyToUnderstand", val)}
          size="large"
        />,
        "Use simple language and shorter sentences"
      )}

      {/* 2. Humanization */}
      {renderOptionRow(
        "Humanization",
        "humanisation",
        <Switch
          checked={getFieldValue("humanisation") || false}
          onCheckedChange={val => setFieldValue("humanisation", val)}
          size="large"
        />,
        "Natural linguistic patterns to bypass AI filters"
      )}

      {/* 3. Extended Thinking */}
      {renderOptionRow(
        "Extended Thinking",
        "extendedThinking",
        <Switch
          checked={getFieldValue("extendedThinking") || false}
          onCheckedChange={val => setFieldValue("extendedThinking", val)}
          size="large"
        />,
        "Deepen AI reasoning for logical outputs"
      )}

      {/* 4. Deep Research */}
      {renderOptionRow(
        "Deep Research",
        "deepResearch",
        <Switch
          checked={getFieldValue("deepResearch") || false}
          onCheckedChange={val => setFieldValue("deepResearch", val)}
          size="large"
        />,
        "Extensive multi-source investigative research"
      )}

      {/* 5. Tone of Voice (Optional placement, but keeping it visible if needed) */}
      {renderOptionRow(
        "Tone of Voice",
        "tone",
        <select
          className="select select-bordered w-[200px] h-10 min-h-0 text-sm"
          value={getFieldValue("tone")}
          onChange={e => setFieldValue("tone", e.target.value)}
        >
          {TONES.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>,
        "Primary communication style"
      )}

      {/* 6. Blog Length (Optional placement) */}
      {renderOptionRow(
        "Blog Length",
        "userDefinedLength",
        <div className="flex flex-col gap-2 w-[200px]">
          <Slider
            min={BLOG_CONFIG.LENGTH.MIN}
            max={BLOG_CONFIG.LENGTH.MAX}
            step={BLOG_CONFIG.LENGTH.STEP}
            value={[getFieldValue("userDefinedLength") || BLOG_CONFIG.LENGTH.DEFAULT]}
            onValueChange={vals => setFieldValue("userDefinedLength", vals[0])}
            className="w-full"
          />
          <span className="text-xs text-gray-500 text-right">
            {getFieldValue("userDefinedLength")} words
          </span>
        </div>,
        "Approximate target word count"
      )}

      {/* 7. Include FAQs */}
      {renderOptionRow(
        "Include FAQs",
        "includeFaqs",
        <Switch
          checked={getFieldValue("includeFaqs") || false}
          onCheckedChange={val => setFieldValue("includeFaqs", val)}
          size="large"
        />,
        "Add frequently asked questions section"
      )}

      {/* 8. Include Interlinks */}
      {renderOptionRow(
        "Include Interlinks",
        "includeInterlinks",
        <Switch
          checked={getFieldValue("includeInterlinks") || false}
          onCheckedChange={val => setFieldValue("includeInterlinks", val)}
          size="large"
        />,
        "Link between relevant generated content"
      )}

      {/* 9. Show Outbound Links */}
      {renderOptionRow(
        "Show Outbound Links",
        "addOutBoundLinks",
        <Switch
          checked={getFieldValue("addOutBoundLinks") || false}
          onCheckedChange={val => setFieldValue("addOutBoundLinks", val)}
          size="large"
        />,
        "Include links to high-authority external sites"
      )}

      {/* 10. Enable Competitive Research */}
      {renderOptionRow(
        "Enable Competitive Research",
        "includeCompetitorResearch",
        <Switch
          checked={getFieldValue("includeCompetitorResearch") || false}
          onCheckedChange={val => setFieldValue("includeCompetitorResearch", val)}
          size="large"
        />,
        "Analyze top performing similar sub-topics"
      )}

      {/* 11. Embed YouTube Videos */}
      {renderOptionRow(
        "Embed YouTube Videos",
        "embedYouTubeVideos",
        <Switch
          checked={getFieldValue("embedYouTubeVideos") || false}
          onCheckedChange={val => setFieldValue("embedYouTubeVideos", val)}
          size="large"
        />,
        "Search and embed relevant videos"
      )}
    </div>
  )
}

export default AdvancedOptions

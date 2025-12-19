import type { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { selectUser } from "@store/slices/authSlice"
import { fetchGeneratedTitles } from "@store/slices/blogSlice"
import {
  Badge,
  Button,
  Empty,
  Flex,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  RadioChangeEvent,
  Select,
  Slider,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  UploadFile,
} from "antd"
import clsx from "clsx"
import { Crown, Sparkles, TriangleAlert } from "lucide-react"
import { FC, useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import "./antd.css"
import { getValueByPath, setValueByPath } from "@utils/ObjectPath"
import { AI_MODELS, TONES, IMAGE_OPTIONS, IMAGE_SOURCE } from "@/data/blogData"
import BlogImageUpload from "@components/multipleStepModal/BlogImageUpload"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { selectSelectedAnalysisKeywords } from "@store/slices/analysisSlice"

const { Text } = Typography

interface AdvancedBlogModalProps {
  onSubmit: Function
  closeFnc: Function
}

const AdvancedBlogModal: FC<AdvancedBlogModalProps> = ({ onSubmit, closeFnc }) => {
  const STEP_TITLES = ["Template Selection", "Basic Information", "Customization", "Blog Options"]

  const initialData = {
    templateIds: [] as number[],
    template: "" as string,
    topic: "" as string,
    focusKeywords: [] as string[],
    keywords: [] as string[],
    title: "" as string,
    tone: "" as string,
    userDefinedLength: 1000 as number,
    brief: "" as string,
    aiModel: AI_MODELS[0].id as string,
    isCheckedGeneratedImages: false as boolean,
    imageSource: IMAGE_OPTIONS[0].id as string,
    numberOfImages: 0 as number,
    blogImages: [] as UploadFile[],
    referenceLinks: [] as string[],
    isCheckedQuick: false as boolean,
    isCheckedBrand: false as boolean,
    brandId: "" as string,
    options: {
      performKeywordResearch: false as boolean,
      includeFaqs: false as boolean,
      includeInterlinks: false as boolean,
      includeCompetitorResearch: false as boolean,
      addOutBoundLinks: false as boolean,
      addCTA: false as boolean,
    },
  }

  const BLOG_OPTIONS = [
    {
      key: "isCheckedQuick",
      label: "Add a Quick Summary",
    },
    {
      key: "options.includeFaqs",
      label: "Add FAQs (Frequently Asked Questions)",
    },
    {
      key: "options.includeInterlinks",
      label: "Include Interlinks",
    },
    {
      key: "options.includeCompetitorResearch",
      label: "Perform Competitive Research",
    },
    {
      key: "options.addOutBoundLinks",
      label: "Show Outbound Links",
    },
  ]

  type FormError = Partial<Record<keyof typeof initialData, string>>

  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  const [currentStep, setCurrentStep] = useState<number>(0)
  const [formData, setFormData] = useState<typeof initialData>(initialData)
  const [errors, setErrors] = useState<FormError>({})

  // For Generating Titles
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateTitles = async () => {
    try {
      setIsGenerating(true)
      if (
        !formData.topic.trim() ||
        formData.focusKeywords.length === 0 ||
        formData.keywords.length === 0
      ) {
        updateErrors({
          topic: !formData.topic.trim() ? "Please enter a topic name" : "",
          focusKeywords:
            formData.focusKeywords.length === 0 ? "Please enter at least 1 focus keyword" : "",
          keywords: formData.keywords.length === 0 ? "Please enter at least 1 keyword" : "",
        })
        message.error(
          "Please enter a topic and at least one focus keyword and keyword before generating titles."
        )
        return
      }
      const payload = {
        template: formData.template,
        topic: formData.topic,
        focusKeywords: formData.focusKeywords,
        keywords: formData.keywords,
        ...(generatedTitles?.length > 0 && { oldTitles: generatedTitles }),
      }
      const result = (await dispatch(fetchGeneratedTitles(payload)).unwrap()) as string[]
      setGeneratedTitles(result)
    } catch (error) {
      console.error("Error generating titles:", error)
      message.error("Failed to generate titles. Please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  // setting the selected analyzed keywords from keywords planner
  const selectedKeywords = useSelector(selectSelectedAnalysisKeywords)
  useEffect(() => {
    if (selectedKeywords) {
      setFormData(prev => ({
        ...prev,
        focusKeywords: selectedKeywords.focusKeywords || prev.focusKeywords,
        keywords: selectedKeywords.keywords || prev.keywords,
      }))
    }
  }, [selectedKeywords])

  const updateFormData = useCallback((newData: Partial<typeof initialData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }, [])

  const updateErrors = useCallback((error: FormError) => {
    setErrors(prev => ({ ...prev, ...error }))
  }, [])

  const validateFields = useCallback(() => {
    const errors: FormError = {}
    switch (currentStep) {
      case 0:
        if (formData.templateIds.length !== 1) errors.template = "Please select at least 1 template"

        break
      case 1:
        if (!formData.topic.length) errors.topic = "Please enter a topic name"

        if (!formData.options.performKeywordResearch) {
          if (!formData.focusKeywords.length)
            errors.focusKeywords = "Please enter at least 1 focus keyword"

          if (!formData.keywords.length) errors.keywords = "Please enter at least 1 keyword"

          if (!formData.title.length) errors.title = "Please enter a title"
        }

        if (!formData.tone.trim()) errors.tone = "Please select a tone of voice"
        break
      case 2:
        if (
          formData.isCheckedGeneratedImages &&
          formData.imageSource === "custom" &&
          formData.blogImages.length == 0
        )
          errors.blogImages = "Please upload at least 1 image."
        break
      case 3:
        if (formData.isCheckedBrand && !formData.brandId.trim())
          errors.brandId = "Please select a Brand Voice"
    }
    if (Object.keys(errors).length) {
      updateErrors(errors)
      return false
    }
    return true
  }, [formData, currentStep, updateErrors])

  const handleNext = useCallback(() => {
    if (validateFields()) {
      setCurrentStep(prev => prev + 1)
    }
  }, [validateFields])

  const handlePrev = useCallback(() => setCurrentStep(prev => prev - 1), [])

  const handleClose = () => {
    setFormData(initialData)
    setErrors({})
    setCurrentStep(0)
    closeFnc?.()
  }

  const handleSubmit = () => {
    if (validateFields()) {
      console.debug("Advanced Modal Form Data : ", formData)
      const data = { ...formData, options: { ...formData.options } } as Partial<typeof initialData>

      // Set imageSource to "none" if images are disabled
      if (!formData.isCheckedGeneratedImages) {
        data.imageSource = IMAGE_SOURCE.NONE
      }

      if (!formData.isCheckedGeneratedImages || formData.imageSource !== "custom") {
        delete data.blogImages
      }
      if (!formData.isCheckedBrand) {
        delete data.brandId
      }
      if (formData.options.performKeywordResearch) {
        delete data.title
        delete data.keywords
        delete data.focusKeywords
      }
      onSubmit?.(data)
    }
  }

  const handleTemplateSelection = useCallback((templates: BlogTemplate[]) => {
    updateFormData({
      template: templates?.[0]?.name || "",
      templateIds: templates?.map(t => t.id),
    })
    updateErrors({ template: "" })
  }, [])

  const handleInputChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | RadioChangeEvent
        | { target: { name: string; value: any } }
    ) => {
      const { name, value } = event.target

      if (!name) throw new Error("Advanced blog form component error")

      const keys = name.split(".")
      // @ts-ignore
      if (keys.length > 1) {
        // @ts-ignore
        setFormData(prev => setValueByPath(prev, keys, value))
      } else {
        updateFormData({ [name]: value })
        // @ts-ignore
        updateErrors({ [name]: "" })
      }
    },
    []
  )

  const renderSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <Flex
            vertical
            gap={8}
            className={clsx("rounded-md !p-2", errors?.template && "border-2 border-red-500")}
          >
            <label className={clsx("text-base mb-2", errors?.template && "text-red-500")}>
              {errors?.template ? (
                errors.template
              ) : (
                <>
                  Select Template:{" "}
                  <span className="font-semibold uppercase text-violet-800 underline">
                    {formData.template}
                  </span>
                </>
              )}
            </label>
            <TemplateSelection
              userSubscriptionPlan={user?.subscription?.plan || "free"}
              preSelectedIds={formData.templateIds}
              onClick={handleTemplateSelection}
            />
          </Flex>
        )
      case 1:
        return (
          <Flex vertical gap={4} justify="space-evenly" className="p-2">
            {/* Topic */}
            <Space direction="vertical" className="form-item-wrapper">
              <label htmlFor="blog-topic">
                Topic <span className="text-red-500">*</span>
              </label>
              <Input
                id="blog-topic"
                name="topic"
                placeholder="e.g., Tech Blog"
                value={formData.topic}
                onChange={handleInputChange}
                className={clsx(
                  "!bg-gray-50 antd-placeholder",
                  errors.topic && "ring-1 !ring-[#ef4444]",
                  "rounded-lg focus:!outline-none focus:!ring-0 focus:!ring-[#1B6FC9]"
                )}
              />
              {errors.topic && <Text className="error-text">{errors.topic}</Text>}
            </Space>

            <Flex justify="space-between" className="mt-3 form-item-wrapper">
              <label htmlFor="blog-auto-generate-title-keywords">
                Auto Generate Title & Keywords
              </label>
              <Switch
                id="blog-auto-generate-title-keywords"
                value={formData.options.performKeywordResearch}
                onChange={checked =>
                  handleInputChange({
                    target: { name: "options.performKeywordResearch", value: checked },
                  })
                }
              />
            </Flex>

            {/* Focus Keywords */}
            <Space
              direction="vertical"
              hidden={formData.options.performKeywordResearch}
              className="form-item-wrapper"
            >
              <label htmlFor="blog-focus-keywords">
                Focus Keywords (max 3) <span className="text-red-500">*</span>
              </label>
              <Select
                id="blog-focus-keywords"
                mode="tags"
                placeholder="Add Focus keywords"
                value={formData.focusKeywords}
                open={false}
                onChange={val =>
                  handleInputChange({ target: { name: "focusKeywords", value: val } })
                }
                maxCount={3}
                tokenSeparators={[","]}
                className={clsx(
                  " !bg-gray-50 custom-placeholder [&>.ant-select-arrow]:hidden border",
                  errors.focusKeywords && "!border-red-500",
                  "rounded-lg focus:border-[#1B6FC9] hover:!border-[#1B6FC9]"
                )}
                style={{ width: "100%" }}
              />
              {errors.focusKeywords && <Text className="error-text">{errors.focusKeywords}</Text>}
            </Space>
            {/* Keywords */}
            <Space
              direction="vertical"
              hidden={formData.options.performKeywordResearch}
              className="form-item-wrapper"
            >
              <label htmlFor="blog-keywords">
                Keywords <span className="text-red-500">*</span>
              </label>
              <Select
                id="blog-keywords"
                mode="tags"
                placeholder="Add Keywords"
                value={formData.keywords}
                open={false}
                onChange={val => handleInputChange({ target: { name: "keywords", value: val } })}
                tokenSeparators={[","]}
                className={clsx(
                  " !bg-gray-50 custom-placeholder [&>.ant-select-arrow]:hidden border",
                  errors.keywords && "!border-red-500",
                  "rounded-lg focus:border-[#1B6FC9] hover:!border-[#1B6FC9]"
                )}
                style={{ width: "100%" }}
              />
              {errors.keywords && <Text className="error-text">{errors.keywords}</Text>}
            </Space>
            {/* Title */}

            <Flex
              vertical
              gap={8}
              hidden={formData.options.performKeywordResearch}
              className="form-item-wrapper !mb-4"
            >
              <label htmlFor="blog-title">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <Space.Compact block>
                <Input
                  id="blog-title"
                  name="title"
                  placeholder="e.g., How to create a blog"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={clsx(
                    " !bg-gray-50 antd-placeholder",
                    errors.title && "ring-1 !ring-[#ef4444]",
                    "focus:!outline-none focus:!ring-0 focus:!ring-[#1B6FC9]"
                  )}
                />
                <Button
                  type="primary"
                  title="AI Generated Titles"
                  icon={<Sparkles className="size-5" />}
                  block
                  loading={isGenerating}
                  onClick={handleGenerateTitles}
                  className="!w-1/4 h-full text-[length:1rem] py-1 px-3 tracking-wide"
                >
                  Generate {generatedTitles?.length ? "More" : "Titles"}
                </Button>
              </Space.Compact>
              {errors.title && <Text className="error-text">{errors.title}</Text>}

              {generatedTitles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatedTitles.map((t, i) => (
                    <Tag
                      key={i}
                      color="geekblue"
                      className={clsx(
                        "cursor-pointer text-[length:1rem] bg-black",
                        formData.title === t && "!bg-blue-500 !text-white",
                        "hover:!bg-blue-400 hover:!text-black p-1"
                      )}
                      onClick={() => {
                        handleInputChange({ target: { name: "title", value: t } })
                      }}
                    >
                      {t}
                    </Tag>
                  ))}
                </div>
              )}
            </Flex>
            {/* Tones & Word Length */}
            <Space direction="vertical" className="form-item-wrapper">
              <Flex justify="space-around" gap={20}>
                <Flex vertical className="w-full" gap={8}>
                  <label htmlFor="blog-tone">
                    Tone of Voice <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="blog-tone"
                    placeholder="Select a tone"
                    value={formData.tone || undefined}
                    onChange={val => handleInputChange({ target: { name: "tone", value: val } })}
                    options={TONES.map(t => ({ label: t, value: t }))}
                    className="custom-placeholder"
                  />
                  {errors.tone && <Text className="error-text">{errors.tone}</Text>}
                </Flex>
                <Flex vertical className="w-full" gap={8}>
                  <label>
                    Blog Words Length :{" "}
                    <Text strong underline className="text-[length:16px] px-2">
                      {formData.userDefinedLength} words
                    </Text>
                  </label>

                  <Slider
                    id="blog-word-length"
                    value={formData.userDefinedLength}
                    onChange={val =>
                      handleInputChange({ target: { name: "userDefinedLength", value: val } })
                    }
                    min={500}
                    max={5000}
                    tooltip={{ formatter: val => `${val} words`, placement: "bottom" }}
                    classNames={{
                      rail: "!bg-gray-400",
                      track: "!bg-gradient-to-tr !from-blue-600 !via-violet-500 !to-purple-500",
                      handle: "hover:!ring-1 hover:!ring-purple-400",
                    }}
                  />
                </Flex>
              </Flex>
            </Space>
            {/* Brief Section */}
            <Space direction="vertical" className="form-item-wrapper">
              <label htmlFor="blog-brief">Add Brief Section</label>
              <Input.TextArea
                id="blog-brief"
                name="brief"
                autoSize={{ minRows: 1, maxRows: 3 }}
                value={formData.brief}
                onChange={handleInputChange}
                placeholder="Enter the brief info or instructions"
                className="antd-placeholder"
              />
            </Space>
          </Flex>
        )

      case 2: {
        const isValidURL = (str: string) => {
          try {
            const url = new URL(str)
            return url.protocol === "http:" || url.protocol === "https:"
          } catch {
            return false
          }
        }

        return (
          <Flex vertical gap={20} className="p-2">
            {/* AI Models */}
            <Space direction="vertical" className="form-item-wrapper">
              <label>Select AI Model</label>
              <Radio.Group
                name="aiModel"
                value={formData.aiModel}
                onChange={handleInputChange}
                defaultValue={AI_MODELS[0]?.id}
                block
                className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full"
              >
                {AI_MODELS.map(model => (
                  <Radio.Button
                    key={model.id}
                    value={model.id}
                    className="rounded-lg !px-4 !py-3 !border-[3px] hover:border-blue-400 hover:bg-purple-50 min-h-fit"
                  >
                    <img src={model.logo} alt={model.label} className="size-6 object-contain" />
                    <span className="text-[length:15px] font-medium text-gray-800">
                      {model.label}
                    </span>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Space>
            {/* Image Settings */}
            <Space direction="vertical" className="form-item-wrapper">
              <Flex justify="space-between">
                <label htmlFor="add-image-toggle">Add Images</label>
                <Switch
                  id="add-image-toggle"
                  value={formData.isCheckedGeneratedImages}
                  onChange={val => {
                    ;[
                      { name: "isCheckedGeneratedImages", value: val },
                      { name: "blogImages", value: [] },
                    ].map(t =>
                      handleInputChange({
                        target: t,
                      })
                    )
                  }}
                />
              </Flex>
            </Space>
            <Space
              direction="vertical"
              hidden={!formData.isCheckedGeneratedImages}
              className="form-item-wrapper"
            >
              <label>Select Image Mode</label>
              <Radio.Group
                name="imageSource"
                value={formData.imageSource}
                onChange={e => {
                  handleInputChange(e)
                  if (e.target.value != "custom") {
                    handleInputChange({ target: { name: "blogImages", value: [] } })
                  }
                }}
                defaultValue={IMAGE_OPTIONS[0]?.id}
                block
                className="p-2 !grid grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 !gap-4 w-full"
              >
                {IMAGE_OPTIONS.map((option, index) => {
                  const isButtonDisabled = option.restrict && user?.subscription?.plan == "free"
                  const isAILimitReached =
                    index == 1 && user?.usage?.aiImages >= user?.usageLimits?.aiImages
                  return (
                    <Badge.Ribbon
                      key={option.id + index}
                      text={
                        isButtonDisabled ? (
                          <Crown className="p-1" />
                        ) : isAILimitReached ? (
                          <TriangleAlert className="p-0.5" />
                        ) : (
                          ""
                        )
                      }
                      className={clsx(
                        "absolute -top-2 z-10",
                        (index == 0 || !(isButtonDisabled || isAILimitReached)) && "hidden"
                      )}
                      color={
                        isButtonDisabled ? "#8b5cf6" : isAILimitReached ? "#dc2626" : "#3b82f6"
                      }
                    >
                      <Tooltip
                        title={
                          <Text
                            strong
                            className="text-[length:15px] text-gray-200 font-montserrat tracking-wide"
                          >
                            {isButtonDisabled
                              ? "Only For Subscribed Users"
                              : isAILimitReached
                              ? "AI Image Limit Reached"
                              : option.label}
                          </Text>
                        }
                        className="w-full"
                        autoAdjustOverflow
                        color={
                          isButtonDisabled ? "#8b5cf6" : isAILimitReached ? "#dc2626" : "#3b82f6"
                        }
                        placement={index == 0 ? "left" : "top"}
                        showArrow
                      >
                        <Radio.Button
                          value={option.id}
                          disabled={isButtonDisabled || isAILimitReached}
                          className="rounded-lg !px-4 !py-3 !border-[3px] text-red-600 hover:border-blue-400 hover:bg-violet-50 min-h-fit min-w-fit"
                        >
                          <span className="text-[length:15px] font-medium text-gray-800">
                            {option.label}
                          </span>
                        </Radio.Button>
                      </Tooltip>
                    </Badge.Ribbon>
                  )
                })}
              </Radio.Group>
            </Space>
            <Space
              direction="vertical"
              hidden={!formData.isCheckedGeneratedImages}
              className="form-item-wrapper"
            >
              {formData.imageSource != IMAGE_OPTIONS.at(-1)?.id ? (
                <Flex align="center" justify="space-between">
                  <label htmlFor="blog-img-count">Number of Images (0 = Decided by AI) : </label>
                  <InputNumber
                    id="blog-img-count"
                    name="numberOfImages"
                    min={0}
                    max={15}
                    value={formData.numberOfImages}
                    defaultValue={0}
                    onChange={val =>
                      handleInputChange({ target: { name: "numberOfImages", value: val || 0 } })
                    }
                    className="w-1/3 !text-base"
                  />
                </Flex>
              ) : (
                <>
                  <BlogImageUpload
                    id="blog-upload-images"
                    label="Upload Custom Images"
                    maxCount={15}
                    initialFiles={formData.blogImages}
                    onChange={file =>
                      handleInputChange({ target: { name: "blogImages", value: file } })
                    }
                  />
                  {errors.blogImages && <Text className="error-text">{errors.blogImages}</Text>}
                </>
              )}
            </Space>
            {/* Reference Links */}
            <Space direction="vertical" className="form-item-wrapper">
              <label htmlFor="blog-references">Reference Links (max 3)</label>
              <Select
                id="blog-references"
                mode="tags"
                placeholder="Add Reference Links"
                value={formData.referenceLinks}
                open={false}
                onChange={val => {
                  const invalidLinks = val.filter(link => !isValidURL(link.trim()))
                  if (invalidLinks.length > 0) {
                    message.warning(
                      "Only valid URLs starting from http:// or https:// are allowed."
                    )
                  }
                  const validLinks = val.filter(isValidURL)

                  handleInputChange({ target: { name: "referenceLinks", value: validLinks } })
                }}
                maxCount={3}
                tokenSeparators={[",", " "]}
                className="!w-full !bg-gray-50 [&>.ant-select-arrow]:hidden custom-placeholder border rounded-lg focus:border-[#1B6FC9] hover:!border-[#1B6FC9]"
              />
            </Space>
          </Flex>
        )
      }
      case 3:
        return (
          <Flex vertical gap="middle" className="p-2">
            {BLOG_OPTIONS.map((option, index) => (
              <Flex key={option.key + index} justify="space-between" className="form-item-wrapper">
                <label htmlFor={`blog-${option.key}`}>{option.label}</label>
                <Switch
                  id={`blog-${option.key}`}
                  value={getValueByPath(formData, option.key)}
                  onChange={checked =>
                    handleInputChange({
                      target: { name: option.key, value: checked },
                    })
                  }
                />
              </Flex>
            ))}
            <Space direction="vertical" className="form-item-wrapper">
              <BrandVoiceSelector
                label="Write with Brand Voice"
                value={{
                  isCheckedBrand: formData.isCheckedBrand,
                  brandId: formData.brandId,
                  addCTA: formData.options.addCTA,
                }}
                onChange={val => {
                  const opts = formData.options
                  updateFormData({
                    isCheckedBrand: val.isCheckedBrand,
                    brandId: val.brandId,
                    options: { ...opts, addCTA: val.addCTA },
                  })
                  updateErrors({ brandId: "" })
                }}
                errorText={errors.brandId}
              />
            </Space>
          </Flex>
        )
      default:
        return <Empty />
    }
  }

  return (
    <Modal
      title={`Generate Advanced Blog | Step ${currentStep + 1} : ${STEP_TITLES[currentStep]}`}
      open={true}
      onCancel={handleClose}
      footer={
        <Flex justify="end" gap={12} className="mt-2">
          {currentStep > 0 && (
            <Button
              onClick={handlePrev}
              type="default"
              className="h-10 px-6 text-[length:1rem] font-medium !text-gray-700 bg-white border border-gray-300 rounded-md hover:!bg-gray-50"
            >
              Previous
            </Button>
          )}
          <Button
            onClick={currentStep === 3 ? handleSubmit : handleNext}
            type="default"
            className="h-10 px-6 text-[length:1rem] font-medium !text-white bg-[#1B6FC9] rounded-md hover:!bg-[#1B6FC9]/90"
          >
            {currentStep === 3 ? "Generate Blog" : "Next"}
          </Button>
        </Flex>
      }
      width={700}
      centered
      transitionName=""
      maskTransitionName=""
      destroyOnHidden
      className="m-2"
    >
      <div
        className="h-full !max-h-[80vh] overflow-auto"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {renderSteps()}
      </div>
    </Modal>
  )
}

export default AdvancedBlogModal

import FirstStepModal from "@components/multipleStepModal/FirstStepModal"
import type { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { selectUser } from "@store/slices/authSlice"
import { fetchGeneratedTitles } from "@store/slices/blogSlice"
import {
  Button,
  Empty,
  Flex,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd"
import clsx from "clsx"
import { RefreshCw, Sparkles } from "lucide-react"
import { FC, useCallback, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

const { Text } = Typography

interface AdvancedBlogModalProps {
  openModal: boolean
  closeFnc: Function
}

const AdvancedBlogModal: FC<AdvancedBlogModalProps> = ({ openModal, closeFnc }) => {
  const initialData = {
    template: "" as string,
    templateIds: [] as number[],
    topic: "" as string,
    focusKeywords: [] as string[],
    keywords: [] as string[],
    title: "" as string,
    tone: "" as string,
    userDefinedLength: 1000 as number,
    brief: "" as string,
    options: {
      autoGenerateTitle: false as boolean,
    },
  }

  type FormError = Partial<Record<keyof typeof initialData, string>>

  const user = useSelector(selectUser)

  const [currentStep, setCurrentStep] = useState<number>(0)
  const [formData, setFormData] = useState<typeof initialData>(initialData)
  const [errors, setErrors] = useState<FormError>({})

  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const dispatch = useDispatch()

  const handleGenerateTitles = async () => {
    try {
      setIsGenerating(true)
      if (
        !formData.topic.trim() ||
        formData.focusKeywords.length === 0 ||
        formData.keywords.length === 0
      ) {
        updateErrors({
          topic: "Please enter a topic name",
          focusKeywords: "Please enter at least 1 focus keyword",
          keywords: "Please enter at least 1 keyword",
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

        if (!formData.focusKeywords.length)
          errors.focusKeywords = "Please enter at least 1 focus keyword"

        if (!formData.keywords.length) errors.keywords = "Please enter at least 1 keyword"

        if (!formData.options.autoGenerateTitle && !formData.title.length)
          errors.title = "Please enter a title"
        break
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
    console.log(formData)
  }

  const handleTemplateSelection = useCallback((templates: BlogTemplate[]) => {
    updateFormData({
      template: templates?.[0]?.name || "",
      templateIds: templates?.map(t => t.id),
    })
    updateErrors({ template: "" })
  }, [])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
      const { name, value } = event.target

      console.log(name, value)
      const keys = name.split(".")
      // @ts-ignore
      if (keys.length > 1) {
        // @ts-ignore
        const ref = formData[keys[0]]
        updateFormData({
          [keys[0]]: {
            ...ref,
            [keys[1]]: value,
          },
        })
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
            <Text className={clsx("text-lg mb-2", errors?.template && "text-red-500")}>
              {errors?.template ? errors.template : "Select Template:"}
            </Text>
            <TemplateSelection
              userSubscriptionPlan={user?.subscription?.plan || "free"}
              preSelectedIds={formData.templateIds}
              onClick={handleTemplateSelection}
            />
          </Flex>
        )
      case 1:
        return (
          <>
            <div className="p-2 md:p-4">
              <Flex vertical gap={16} justify="space-between">
                {/* Topic */}
                <Space direction="vertical" className="w-full">
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
                      " !bg-gray-50",
                      errors.topic && "ring-1 !ring-[#ef4444]",
                      "rounded-lg focus:!outline-none focus:!ring-0 focus:!ring-[#1B6FC9]"
                    )}
                  />
                  {errors.topic && <Text className="error-text">{errors.topic}</Text>}
                </Space>

                {/* Focus Keywords */}
                <Space direction="vertical" className="w-full">
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
                      " !bg-gray-50 border",
                      errors.focusKeywords && "!border-red-500",
                      "rounded-lg focus:border-[#1B6FC9] hover:!border-[#1B6FC9]"
                    )}
                    style={{ width: "100%" }}
                  />
                  {errors.focusKeywords && (
                    <Text className="error-text">{errors.focusKeywords}</Text>
                  )}
                </Space>

                {/* Keywords */}
                <Space direction="vertical" className="w-full">
                  <label htmlFor="blog-keywords">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="blog-keywords"
                    mode="tags"
                    placeholder="Add Keywords"
                    value={formData.keywords}
                    open={false}
                    onChange={val =>
                      handleInputChange({ target: { name: "keywords", value: val } })
                    }
                    tokenSeparators={[","]}
                    className={clsx(
                      " !bg-gray-50 border",
                      errors.keywords && "!border-red-500",
                      "rounded-lg focus:border-[#1B6FC9] hover:!border-[#1B6FC9]"
                    )}
                    style={{ width: "100%" }}
                  />
                  {errors.keywords && <Text className="error-text">{errors.keywords}</Text>}
                </Space>

                {/* Title */}
                <Space direction="vertical" className="w-full">
                  <Flex justify="space-between">
                    <label htmlFor="blog-auto-generate-title">Auto Generate Title</label>
                    <Switch
                      id="blog-auto-generate-title"
                      value={formData.options.autoGenerateTitle}
                      onChange={checked =>
                        handleInputChange({
                          target: { name: "options.autoGenerateTitle", value: checked },
                        })
                      }
                    />
                  </Flex>
                  {/* Title */}
                  <Flex vertical gap={8} hidden={formData.options.autoGenerateTitle}>
                    <label htmlFor="blog-title">
                      Blog Title <span className="text-red-500">*</span>
                    </label>
                    <Space.Compact block>
                      <Input
                        id="blog-title"
                        name="title"
                        placeholder="e.g., Tech Blog"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={clsx(
                          " !bg-gray-50",
                          errors.title && "ring-1 !ring-[#ef4444]",
                          "focus:!outline-none focus:!ring-0 focus:!ring-[#1B6FC9]"
                        )}
                      />
                      <Button
                        type="primary"
                        title="AI Generated Titles"
                        icon={<Sparkles />}
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
                </Space>
              </Flex>
            </div>
          </>
        )
      default:
        return <Empty />
    }
  }

  return (
    <>
      <Modal
        title={`Generate Advanced Blog | Step ${currentStep + 1}`}
        open={openModal}
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
              onClick={currentStep === 2 ? handleSubmit : handleNext}
              type="default"
              className="h-10 px-6 text-[length:1rem] font-medium !text-white bg-[#1B6FC9] rounded-md hover:!bg-[#1B6FC9]/90"
            >
              {currentStep === 2 ? "Generate Blog" : "Next"}
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
        {renderSteps()}
      </Modal>
      <style>{`
label{
display: block;
font-weight:500;
font-size: 0.95rem;
letter-spacing:0.5px;
}

.error-text{
color:red !important;
padding: .2rem;
font-size: .9rem;
}

.ant-select-selection-item {
  background-color: #e6f4ff !important; /* light blue background */
  border: 1px solid #91caff !important;
  color: #0958d9 !important;
  border-radius: 6px !important;
  padding: 2px 8px !important;
  font-weight: 500;
  font-size: .9rem;
}

/* For the remove icon (the “x”) */
.ant-select-selection-item-remove {
  color: black !important;
}

.ant-select-selection-item-remove:hover {
  color: black !important;
  font-weight:bold !important;
}
      `}</style>
    </>
  )
}

export default AdvancedBlogModal

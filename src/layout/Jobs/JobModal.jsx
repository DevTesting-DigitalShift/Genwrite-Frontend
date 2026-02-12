import React, { useState, useEffect } from "react"
import { Modal, message } from "antd"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"
import StepContent from "./StepContent"
import { useCreateJobMutation, useUpdateJobMutation } from "@api/queries/jobQueries"
import { IMAGE_SOURCE } from "@/data/blogData"
import { validateJobData } from "@/types/forms.schemas"

const JobModal = ({ user, userPlan, isUserLoaded }) => {
  const { showJobModal, closeJobModal, selectedJob } = useJobStore()
  const { selectedKeywords, clearSelectedKeywords } = useAnalysisStore()
  const initialJob = {
    name: "",
    schedule: { type: "daily", customDates: [], daysOfWeek: [], daysOfMonth: [] },
    blogs: {
      numberOfBlogs: 1,
      topics: [],
      keywords: [],
      templates: [],
      tone: "Professional",
      userDefinedLength: 1000,
      imageSource: IMAGE_SOURCE.STOCK,
      aiModel: "gemini",
      brandId: null,
      useBrandVoice: false,
      isCheckedGeneratedImages: true,
      isCheckedCustomImages: false,
      addCTA: true,
      numberOfImages: 0,
      blogImages: [],
      postingType: null,
      languageToWrite: "English",
      costCutter: true,
    },
    options: {
      wordpressPosting: false,
      includeFaqs: false,
      includeCompetitorResearch: false,
      includeInterlinks: false,
      performKeywordResearch: false,
      includeTableOfContents: false,
      addOutBoundLinks: false,
      easyToUnderstand: false,
      embedYouTubeVideos: false,
    },
    status: "active",
    templateIds: [],
  }
  const { mutate: createJobMutate, isPending: isCreating } = useCreateJobMutation()
  const { mutate: updateJobMutate, isPending: isUpdating } = useUpdateJobMutation()

  const [currentStep, setCurrentStep] = useState(1)
  const [newJob, setNewJob] = useState(initialJob)
  const [formData, setFormData] = useState({
    keywords: initialJob.blogs.keywords || [],
    keywordInput: "",
    performKeywordResearch: initialJob.options.performKeywordResearch,
    aiModel: initialJob.blogs.aiModel,
    postingType: initialJob.blogs.postingType,
  })
  const [errors, setErrors] = useState({})
  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState(null)
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)

  const MAX_BLOGS = 10

  // Clear Job Modules and it's states on close
  useEffect(() => {
    if (!showJobModal) {
      setNewJob(prev => initialJob)
      setFormData({
        keywords: [],
        keywordInput: "",
        performKeywordResearch: false,
        postingType: "WORDPRESS",
        aiModel: "gemini",
      })
      setCurrentStep(1)
      setErrors({})
      clearSelectedKeywords()
    }
  }, [showJobModal, clearSelectedKeywords])

  useEffect(() => {
    if (selectedJob) {
      setFormData(prev => ({
        ...prev,
        aiModel: selectedJob.blogs?.aiModel || initialJob.blogs.aiModel,
        performKeywordResearch:
          selectedJob.options?.performKeywordResearch ?? initialJob.options.performKeywordResearch,
        keywords: selectedJob.blogs?.keywords ?? initialJob.blogs.keywords,
        postingType: selectedJob.blogs?.postingType || initialJob.blogs.postingType,
        templates: selectedJob.blogs?.templates || initialJob.blogs.templates,
      }))
      setNewJob(selectedJob)
    } else {
      setNewJob(initialJob)
    }
  }, [selectedJob])

  useEffect(() => {
    let baseJob = selectedJob ? { ...selectedJob } : initialJob
    let mergedTopics = [...(baseJob.blogs.topics || []), ...(selectedKeywords?.allKeywords || [])]
    let mergedKeywords = [
      ...(baseJob.blogs.keywords || []),
      ...(selectedKeywords?.focusKeywords || []),
      ...(selectedKeywords?.allKeywords || []),
    ]

    setNewJob({
      ...baseJob,
      blogs: {
        ...baseJob.blogs,
        topics: [...new Set(mergedTopics)],
        keywords: [...new Set(mergedKeywords)],
      },
    })

    setFormData(prev => ({
      ...prev,
      keywords: [
        ...new Set([
          ...(prev.keywords || []),
          ...(selectedKeywords?.focusKeywords || []),
          ...(selectedKeywords?.allKeywords || []),
        ]),
      ],
    }))
  }, [selectedKeywords, selectedJob])

  useEffect(() => {
    const uniqueKeywords = [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ]
    if (uniqueKeywords.length > 0) {
      setFormData(prev => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...uniqueKeywords])],
      }))
      setNewJob(prev => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          keywords: [...new Set([...prev.blogs.keywords, ...uniqueKeywords])],
        },
      }))
    }
  }, [selectedKeywords])

  const validateSteps = step => {
    const newErrors = {}
    if (step === 1 || step === "all") {
      if (newJob.blogs.templates.length === 0) {
        newErrors.templates = "Please select at least one template."
      }
    }
    if (step === 2 || step === "all") {
      if (!newJob.name) newErrors.name = "Please enter a job name."
      if (newJob.blogs.topics.length === 0) newErrors.topics = "Please add at least one topic."
      if (!newJob.blogs.tone) newErrors.tone = "Please select a tone."
      if (!formData.performKeywordResearch && formData.keywords.length === 0) {
        newErrors.keywords = "Please add at least one keyword or enable keyword research."
      }
    }
    if (step === 3 || step === "all") {
      if (newJob.blogs.numberOfBlogs < 1 || newJob.blogs.numberOfBlogs > MAX_BLOGS) {
        newErrors.numberOfBlogs = `Number of blogs must be between 1 and ${MAX_BLOGS}.`
      }
      if (newJob.blogs.numberOfImages < 0 || newJob.blogs.numberOfImages > MAX_BLOGS) {
        newErrors.numberOfImages = `Number of images must be between 0 and 20.`
      }
      if (newJob.blogs.useBrandVoice && !newJob.blogs.brandId) {
        newErrors.brandId = "Please select a brand voice."
      }
      if (newJob.schedule.type === "weekly" && newJob.schedule.daysOfWeek.length === 0) {
        newErrors.daysOfWeek = "Please select at least one day of the week."
      }
      if (newJob.schedule.type === "monthly" && newJob.schedule.daysOfMonth.length === 0) {
        newErrors.daysOfMonth = "Please select at least one day of the month."
      }
      if (newJob.schedule.type === "custom" && newJob.schedule.customDates.length === 0) {
        newErrors.customDates = "Please select at least one custom date."
      }
      if (newJob.blogs.isCheckedGeneratedImages && !newJob.blogs.imageSource) {
        newErrors.imageSource = "Please select an image source."
      }
    }
    if (step === 4 || step === "all") {
      if (newJob.options.wordpressPosting && !formData.postingType) {
        newErrors.postingType = "Please select a posting platform."
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetModal = () => {
    closeJobModal()
    setNewJob(initialJob)
    setFormData({
      keywords: [],
      keywordInput: "",
      performKeywordResearch: false,
      postingType: "WORDPRESS",
      aiModel: "gemini",
    })
    setCurrentStep(1)
    setErrors({})
    clearSelectedKeywords()
  }

  const handleCreateJob = async () => {
    if (!validateSteps("all")) return
    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
        keywords: formData.keywords,
        aiModel: formData.aiModel,
        postingType: formData.postingType,
        imageSource: newJob.blogs.isCheckedGeneratedImages
          ? newJob.blogs.imageSource
          : IMAGE_SOURCE.NONE,
      },
      options: {
        ...newJob.options,
        performKeywordResearch: formData.performKeywordResearch,
        brandId: newJob.blogs.useBrandVoice ? newJob.blogs.brandId : null,
      },
    }

    const validatedPayload = validateJobData(jobPayload)
    createJobMutate(validatedPayload, {
      onSuccess: () => {
        resetModal()
      },
    })
  }

  const handleUpdateJob = async jobId => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (!validateSteps("all")) return
    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
        keywords: formData.keywords,
        aiModel: formData.aiModel,
        postingType: formData.postingType,
        imageSource: newJob.blogs.isCheckedGeneratedImages
          ? newJob.blogs.imageSource
          : IMAGE_SOURCE.NONE,
      },
      options: {
        ...newJob.options,
        performKeywordResearch: formData.performKeywordResearch,
        brandId: newJob.blogs.useBrandVoice ? newJob.blogs.brandId : null,
      },
    }

    const validatedPayload = validateJobData(jobPayload)
    updateJobMutate(
      { jobId, jobPayload: validatedPayload },
      {
        onSuccess: () => {
          resetModal()
        },
      }
    )
  }

  const footerButtons = [
    currentStep > 1 && (
      <button
        key="previous"
        onClick={() => setCurrentStep(currentStep - 1)}
        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg mr-3 hover:bg-gray-300"
        aria-label="Previous step"
      >
        Previous
      </button>
    ),
    currentStep < 3 && (
      <button
        key="next"
        onClick={() => {
          if (validateSteps(currentStep)) setCurrentStep(currentStep + 1)
        }}
        className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
        aria-label="Next step"
      >
        Next
      </button>
    ),
    currentStep === 3 && (
      <button
        key="next-step-4"
        onClick={() => {
          if (validateSteps(currentStep)) setCurrentStep(4)
        }}
        className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
        aria-label="Next step"
      >
        Next
      </button>
    ),
    currentStep === 4 && (
      <button
        key="submit"
        onClick={selectedJob ? () => handleUpdateJob(selectedJob._id) : handleCreateJob}
        className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
        aria-label={selectedJob ? "Update job" : "Create job"}
        disabled={isCreating || isUpdating}
      >
        {isCreating || isUpdating ? "Processing..." : selectedJob ? "Update Job" : "Create Job"}
      </button>
    ),
  ]

  return (
    <Modal
      title={`Step ${currentStep}: ${
        currentStep === 1
          ? "Select Templates"
          : currentStep === 2
            ? "Job Details"
            : currentStep === 3
              ? "Schedule Settings"
              : "Blog Options"
      }`}
      open={showJobModal}
      onCancel={() => {
        closeJobModal()
      }}
      footer={footerButtons}
      width={800}
      centered
      className="custom-modal"
    >
      <div className="p-2 md:p-4 max-h-[80vh] overflow-y-auto">
        <StepContent
          currentStep={currentStep}
          newJob={newJob}
          setNewJob={setNewJob}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          recentlyUploadedTopicsCount={recentlyUploadedTopicsCount}
          setRecentlyUploadedTopicsCount={setRecentlyUploadedTopicsCount}
          recentlyUploadedKeywordsCount={recentlyUploadedKeywordsCount}
          setRecentlyUploadedKeywordsCount={setRecentlyUploadedKeywordsCount}
          showAllTopics={showAllTopics}
          setShowAllTopics={setShowAllTopics}
          showAllKeywords={showAllKeywords}
          setShowAllKeywords={setShowAllKeywords}
          user={user}
          userPlan={userPlan}
        />
      </div>
    </Modal>
  )
}

export default JobModal

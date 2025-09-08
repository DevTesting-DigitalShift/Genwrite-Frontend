// @components/Jobs/JobModal.jsx
import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Modal, message } from "antd"
import { closeJobModal, createJobThunk, fetchJobs, updateJobThunk } from "@store/slices/jobSlice"
import { clearSelectedKeywords } from "@store/slices/analysisSlice"
import StepContent from "./StepContent"

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
    imageSource: "unsplash",
    aiModel: "gemini",
    brandId: null,
    useBrandVoice: false,
    isCheckedGeneratedImages: true,
    addCTA: true,
    numberOfImages: 0,
  },
  options: {
    wordpressPosting: false,
    includeFaqs: false,
    includeCompetitorResearch: false,
    includeInterlinks: false,
    performKeywordResearch: false,
    includeTableOfContents: false,
    addOutBoundLinks: false,
  },
  status: "active",
}

const JobModal = ({ showJobModal, selectedKeywords, user, userPlan, isUserLoaded }) => {
  const dispatch = useDispatch()
  const { selectedJob } = useSelector((state) => state.jobs) // Get selected job from Redux
  const [currentStep, setCurrentStep] = useState(1)
  const [newJob, setNewJob] = useState(initialJob)
  const [formData, setFormData] = useState({
    keywords: [],
    keywordInput: "",
    performKeywordResearch: true,
  })
  const [errors, setErrors] = useState({})
  const [recentlyUploadedCount, setRecentlyUploadedCount] = useState(null)
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)

  const MAX_BLOGS = 100

  // Initialize newJob with selectedJob when editing
  useEffect(() => {
    if (selectedJob) {
      setNewJob({
        ...selectedJob,
        blogs: {
          ...selectedJob.blogs,
          keywords: selectedJob.blogs.keywords || [],
          topics: selectedJob.blogs.topics || [],
          templates: selectedJob.blogs.templates || [],
        },
        options: {
          ...selectedJob.options,
          performKeywordResearch: selectedJob.options.performKeywordResearch || false,
        },
      })
      setFormData({
        keywords: selectedJob.blogs.keywords || [],
        keywordInput: "",
        performKeywordResearch: selectedJob.options.performKeywordResearch || false,
      })
    } else {
      setNewJob(initialJob)
      setFormData({ keywords: [], keywordInput: "", performKeywordResearch: true })
    }
  }, [selectedJob])

  // Merge selectedKeywords into formData and newJob
  useEffect(() => {
    const uniqueKeywords = [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ]
    if (uniqueKeywords.length > 0) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...uniqueKeywords])],
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          keywords: [...new Set([...prev.blogs.keywords, ...uniqueKeywords])],
        },
      }))
    }
  }, [selectedKeywords])

  const validateSteps = (step) => {
    const errors = {}
    if (step === 1) {
      if (newJob.blogs.templates.length === 0) {
        errors.template = true
        message.error("Please select at least one template before proceeding.")
      }
    }
    if (step === 2) {
      if (!newJob.name || newJob.blogs.topics.length === 0) {
        if (!newJob.name) errors.name = true
        if (newJob.blogs.topics.length === 0) errors.topics = true
        const messages = []
        if (errors.name) messages.push("job name")
        if (errors.topics) messages.push("at least one topic")
        message.error(`Please enter ${messages.join(" and ")}.`)
      }
    }
    if (step === 3) {
      if (newJob.blogs.numberOfBlogs < 1 || newJob.blogs.numberOfBlogs > MAX_BLOGS) {
        errors.numberOfBlogs = true
        message.error(`Number of blogs must be between 1 and ${MAX_BLOGS}.`)
      }
      if (!formData.performKeywordResearch && formData.keywords.length === 0) {
        errors.keywords = true
        message.error("Please add at least one keyword or enable keyword research.")
      }
      if (newJob.blogs.useBrandVoice && !newJob.blogs.brandId) {
        errors.brandId = true
        message.error("Please select a brand voice.")
      }
      if (
        newJob.schedule.type === "weekly" &&
        (!newJob.schedule.daysOfWeek || newJob.schedule.daysOfWeek.length === 0)
      ) {
        errors.daysOfWeek = true
        message.error("Please select at least one day of the week.")
      }
      if (
        newJob.schedule.type === "monthly" &&
        (!newJob.schedule.daysOfMonth || newJob.schedule.daysOfMonth.length === 0)
      ) {
        errors.daysOfMonth = true
        message.error("Please select at least one date of the month.")
      }
      if (
        newJob.schedule.type === "custom" &&
        (!newJob.schedule.customDates || newJob.schedule.customDates.length === 0)
      ) {
        errors.customDates = true
        message.error("Please select at least one custom date.")
      }
    }
    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateJob = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (!validateSteps(2) || !validateSteps(3)) return
    const jobPayload = {
      ...newJob,
      blogs: { ...newJob.blogs, keywords: formData.keywords },
      options: {
        ...newJob.options,
        performKeywordResearch: formData.performKeywordResearch,
        brandId: newJob.blogs.useBrandVoice ? newJob.blogs.brandId : null,
      },
    }
    dispatch(
      createJobThunk({
        jobPayload,
        user,
        onSuccess: () => {
          dispatch(closeJobModal())
          dispatch(fetchJobs())
          setNewJob(initialJob)
          setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false })
          setCurrentStep(1)
        },
      })
    )
  }

  const handleUpdateJob = (jobId) => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (!validateSteps(2) || !validateSteps(3)) return
    const jobPayload = {
      ...newJob,
      blogs: { ...newJob.blogs, keywords: formData.keywords },
      options: {
        ...newJob.options,
        performKeywordResearch: formData.performKeywordResearch,
        brandId: newJob.blogs.useBrandVoice ? newJob.blogs.brandId : null,
      },
    }
    dispatch(
      updateJobThunk({
        jobId,
        jobPayload,
        onSuccess: () => {
          dispatch(closeJobModal())
          dispatch(fetchJobs())
          setNewJob(initialJob)
          setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false })
          setCurrentStep(1)
        },
      })
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
      >
        {selectedJob ? "Update" : "Create"} Job
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
        dispatch(closeJobModal())
        setNewJob(initialJob)
        setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false })
        setCurrentStep(1)
        setErrors({})
        dispatch(clearSelectedKeywords())
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
          recentlyUploadedCount={recentlyUploadedCount}
          setRecentlyUploadedCount={setRecentlyUploadedCount}
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

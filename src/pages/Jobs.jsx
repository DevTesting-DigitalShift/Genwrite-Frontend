import React, { useState, useEffect, useMemo } from "react";
import MultiDatePicker from "react-multi-date-picker";
import { motion } from "framer-motion";
import Carousel from "@components/multipleStepModal/Carousel";
import { packages } from "@constants/templates";
import { FiPlus, FiSettings, FiCalendar, FiFileText, FiEdit } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { message, Modal, Pagination, Popconfirm, Select, Tooltip } from "antd";
import { Crown, Info, Plus, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet";
import {
  closeJobModal,
  createJobThunk,
  deleteJobThunk,
  fetchJobs,
  openJobModal,
  toggleJobStatusThunk,
  updateJobThunk,
} from "@store/slices/jobSlice";
import SkeletonLoader from "@components/Projects/SkeletonLoader";
import { selectUser } from "@store/slices/authSlice";
import { openUpgradePopup } from "@utils/UpgardePopUp";
import UpgradeModal from "@components/UpgradeModal";

const { Option } = Select;

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
    imageSource: "stock images",
    aiModel: "gemini",
  },
  options: {
    wordpressPosting: false,
    includeFaqs: false,
    useBrandVoice: false,
    includeCompetitorResearch: false,
    includeInterlinks: false,
    performKeywordResearch: false,
    includeTableOfContents: false,
  },
  status: "active",
};

const PAGE_SIZE = 15;
const MAX_BLOGS = 100;

// Job limits based on user plan
const JOB_LIMITS = {
  free: 0,
  basic: 1,
  pro: 5,
  enterprise: Infinity,
};

const Jobs = () => {
  const tones = ["Professional", "Casual", "Friendly", "Formal", "Technical"];
  const wordLengths = [500, 1000, 1500, 2000, 3000];
  const [currentStep, setCurrentStep] = useState(1);
  const [newJob, setNewJob] = useState(initialJob);
  const [topicInput, setTopicInput] = useState("");
  const [errors, setErrors] = useState({});
  const user = useSelector(selectUser);
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase();
  const navigate = useNavigate();
  const [recentlyUploadedCount, setRecentlyUploadedCount] = useState(null);
  const dispatch = useDispatch();
  const { jobs, loading: isLoading, showJobModal } = useSelector((state) => state.jobs);
  const [currentPage, setCurrentPage] = useState(1);
  const { selectedKeywords } = useSelector((state) => state.analysis);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  // Redirect to UpgradeModal for free plan
  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />;
  }

  // Initialize formData with keywords from selectedKeywords
  const [formData, setFormData] = useState({
    keywords: [],
    keywordInput: "",
    performKeywordResearch: false,
  });

  // Calculate total pages
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);

  // Memoize paginated jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return jobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [jobs, currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  // Check if user is loaded
  useEffect(() => {
    setIsUserLoaded(!!(user?.name || user?.credits));
  }, [user]);

  // Sync formData and newJob with selectedKeywords
  useEffect(() => {
    const uniqueKeywords = [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ];
    setFormData((prev) => ({
      ...prev,
      keywords: [...new Set([...prev.keywords, ...uniqueKeywords])],
    }));
    setNewJob((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        keywords: [...new Set([...prev.blogs.keywords, ...uniqueKeywords])],
      },
    }));
  }, [selectedKeywords]);

  const validateSteps = (step) => {
    const errors = {};
    if (step === 1) {
      if (newJob.blogs.templates.length === 0) {
        errors.template = true;
        message.error("Please select at least one template before proceeding.");
      }
    }
    if (step === 2) {
      if (!newJob.name) {
        errors.name = true;
        message.error("Please enter a job name.");
      }
      if (newJob.blogs.topics.length === 0) {
        errors.topics = true;
        message.error("Please add at least one topic.");
      }
      if (!formData.performKeywordResearch && formData.keywords.length === 0) {
        errors.keywords = true;
        message.error("Please add at least one keyword or enable keyword research.");
      }
    }
    if (step === 4) {
      if (newJob.blogs.numberOfBlogs < 1 || newJob.blogs.numberOfBlogs > MAX_BLOGS) {
        errors.numberOfBlogs = true;
        message.error(`Number of blogs must be between 1 and ${MAX_BLOGS}.`);
      }
      if (
        newJob.schedule.type === "weekly" &&
        (!newJob.schedule.daysOfWeek || newJob.schedule.daysOfWeek.length === 0)
      ) {
        errors.daysOfWeek = true;
        message.error("Please select at least one day of the week.");
      }
      if (
        newJob.schedule.type === "monthly" &&
        (!newJob.schedule.daysOfMonth || newJob.schedule.daysOfMonth.length === 0)
      ) {
        errors.daysOfMonth = true;
        message.error("Please select at least one date of the month.");
      }
      if (
        newJob.schedule.type === "custom" &&
        (!newJob.schedule.customDates || newJob.schedule.customDates.length === 0)
      ) {
        errors.customDates = true;
        message.error("Please select at least one custom date.");
      }
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkJobLimit = () => {
    const limit = JOB_LIMITS[userPlan] || 0;
    if (jobs.length >= limit && !newJob._id) {
      message.error(
        `You have reached the job limit for your ${userPlan} plan (${limit} job${limit === 1 ? "" : "s"}). ${
          userPlan === "basic" ? "Delete an existing job to create a new one." : "Please upgrade your plan to create more jobs."
        }`
      );
      if (userPlan !== "basic") {
        openUpgradePopup({ featureName: "Additional Jobs", navigate });
      }
      return false;
    }
    return true;
  };

  const handleCreateJob = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.");
      return;
    }
    if (!checkJobLimit()) return;
    if (!validateSteps(2) || !validateSteps(4)) return;
    const jobPayload = {
      ...newJob,
      blogs: { ...newJob.blogs, keywords: formData.keywords },
      options: { ...newJob.options, performKeywordResearch: formData.performKeywordResearch },
    };
    dispatch(
      createJobThunk({
        jobPayload,
        onSuccess: () => {
          dispatch(closeJobModal());
          dispatch(fetchJobs());
          setCurrentPage(1);
          setNewJob(initialJob);
          setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false });
        },
      })
    );
  };

  const handleUpdateJob = (jobId) => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.");
      return;
    }
    if (!validateSteps(2) || !validateSteps(4)) return;
    const jobPayload = {
      ...newJob,
      blogs: { ...newJob.blogs, keywords: formData.keywords },
      options: { ...newJob.options, performKeywordResearch: formData.performKeywordResearch },
    };
    dispatch(
      updateJobThunk({
        jobId,
        jobPayload,
        onSuccess: () => {
          dispatch(closeJobModal());
          dispatch(fetchJobs());
          setCurrentPage(1);
          setNewJob(initialJob);
          setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false });
        },
      })
    );
  };

  const handleNumberOfBlogsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= MAX_BLOGS) {
      setNewJob({ ...newJob, blogs: { ...newJob.blogs, numberOfBlogs: value } });
      setErrors((prev) => ({ ...prev, numberOfBlogs: false }));
    }
  };

  const handleStartJob = (jobId) => {
    const job = jobs.find((job) => job._id === jobId);
    if (!job) {
      message.error("Job not found.");
      return;
    }
    dispatch(toggleJobStatusThunk({ jobId, currentStatus: job.status }));
  };

  const handleDeleteJob = (jobId) => {
    dispatch(deleteJobThunk(jobId));
    if (paginatedJobs.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleAddItems = (input, type) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const existing =
      type === "topics"
        ? newJob.blogs.topics.map((t) => t.toLowerCase().trim())
        : formData.keywords.map((k) => k.toLowerCase().trim());
    const seen = new Set();
    const newItems = trimmedInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => {
        const lower = item.toLowerCase();
        if (!item || seen.has(lower) || existing.includes(lower)) return false;
        seen.add(lower);
        return true;
      });

    if (newItems.length === 0) return;

    if (type === "topics") {
      setNewJob((prev) => ({
        ...prev,
        blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...newItems] },
      }));
      setTopicInput("");
      setErrors((prev) => ({ ...prev, topics: false }));
    } else {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, ...newItems],
        keywordInput: "",
      }));
      setNewJob((prev) => ({
        ...prev,
        blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...newItems] },
      }));
      setErrors((prev) => ({ ...prev, keywords: false }));
    }
  };

  const handleCSVUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Invalid file type. Please upload a .csv file.");
      e.target.value = null;
      return;
    }

    const maxSizeInBytes = 20 * 1024;
    if (file.size > maxSizeInBytes) {
      message.error("File size exceeds 20KB limit. Please upload a smaller file.");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) return;

      const lines = text.trim().split(/\r?\n/).slice(1);
      const items = lines
        .map((line) => {
          const parts = line.split(",");
          return parts.length >= 2 ? parts[1].trim() : null;
        })
        .filter(Boolean);

      const existing =
        type === "topics"
          ? newJob.blogs.topics.map((t) => t.toLowerCase().trim())
          : formData.keywords.map((k) => k.toLowerCase().trim());
      const uniqueNewItems = items.filter((item) => !existing.includes(item.toLowerCase().trim()));

      if (uniqueNewItems.length === 0) {
        message.warning(`No new ${type} found in the CSV.`);
        return;
      }

      if (type === "topics") {
        setNewJob((prev) => ({
          ...prev,
          blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...uniqueNewItems] },
        }));
        setErrors((prev) => ({ ...prev, topics: false }));
      } else {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...uniqueNewItems],
        }));
        setNewJob((prev) => ({
          ...prev,
          blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...uniqueNewItems] },
        }));
        setErrors((prev) => ({ ...prev, keywords: false }));
      }

      if (uniqueNewItems.length > 8) {
        setRecentlyUploadedCount(uniqueNewItems.length);
        setTimeout(() => setRecentlyUploadedCount(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleEditJob = (job) => {
    if (!job?._id) {
      message.error("Invalid job ID.");
      return;
    }
    if (job.status === "active") {
      message.error("Stop the job before editing.");
      return;
    }
    const uniqueKeywords = [
      ...new Set([...(job.blogs.keywords || []), ...(selectedKeywords?.focusKeywords || [])]),
    ];
    setNewJob({ ...job, blogs: { ...job.blogs, keywords: uniqueKeywords } });
    setFormData({
      keywords: uniqueKeywords,
      keywordInput: "",
      performKeywordResearch: job.options.performKeywordResearch || false,
    });
    dispatch(openJobModal());
    setCurrentStep(1);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === "wordpressPosting" && checked && !user?.wordpressLink) {
      message.error(
        "Please connect your WordPress account in your profile before enabling automatic posting."
      );
      navigate("/profile");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: checked }));
    setNewJob((prev) => ({ ...prev, options: { ...prev.options, [name]: checked } }));
  };

  const handleOpenJobModal = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.");
      return;
    }
    if (!checkJobLimit()) return;
    const uniqueKeywords = [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ];
    setNewJob({ ...initialJob, blogs: { ...initialJob.blogs, keywords: uniqueKeywords } });
    setFormData({ keywords: uniqueKeywords, keywordInput: "", performKeywordResearch: true });
    dispatch(openJobModal());
    setCurrentStep(1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <p className="text-sm text-gray-600 mb-4">
              Select up to 3 templates for the types of blogs you want to generate.
            </p>
            <Carousel>
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`cursor-pointer transition-all duration-200 ${
                    newJob.blogs.templates.includes(pkg.name)
                      ? "border-gray-300 border-2 rounded-lg"
                      : errors.template
                      ? "border-red-500 border-2"
                      : ""
                  }`}
                  onClick={() => {
                    if (newJob.blogs.templates.includes(pkg.name)) {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          templates: prev.blogs.templates.filter(
                            (template) => template !== pkg.name
                          ),
                        },
                      }));
                      setErrors((prev) => ({ ...prev, template: false }));
                    } else if (newJob.blogs.templates.length < 3) {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                      }));
                      setErrors((prev) => ({ ...prev, template: false }));
                    } else {
                      message.error("You can only select up to 3 templates.");
                    }
                  }}
                >
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
                <input
                  type="text"
                  value={newJob.name}
                  placeholder="Enter job name"
                  onChange={(e) => {
                    setNewJob({ ...newJob, name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: false }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                  aria-label="Job name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 items-center">
                  Topics
                  <Tooltip title="Upload a .csv file in the format: `S.No., Keyword`">
                    <Info size={16} className="text-blue-500 cursor-pointer" />
                  </Tooltip>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={topicInput}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItems(topicInput, "topics")}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.topics ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Add a topic..."
                    aria-label="Add topic"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddItems(topicInput, "topics")}
                    className="px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg"
                    aria-label="Add topic"
                  >
                    <Plus />
                  </motion.button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, "topics")}
                      hidden
                    />
                    <span className="sr-only">Upload CSV for topics</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newJob.blogs.topics
                    .slice()
                    .reverse()
                    .slice(0, 18)
                    .map((topic, reversedIndex) => {
                      const actualIndex = newJob.blogs.topics.length - 1 - reversedIndex;
                      return (
                        <span
                          key={`${topic}-${actualIndex}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() =>
                              setNewJob((prev) => ({
                                ...prev,
                                blogs: {
                                  ...prev.blogs,
                                  topics: prev.blogs.topics.filter((_, i) => i !== actualIndex),
                                },
                              }))
                            }
                            className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                            aria-label={`Remove topic ${topic}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  {(newJob.blogs.topics.length > 18 || recentlyUploadedCount) && (
                    <span className="text-xs font-medium text-blue-600 self-center">
                      {newJob.blogs.topics.length > 18 &&
                        `+${newJob.blogs.topics.length - 18} more `}
                      {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone of Voice
                </label>
                <Select
                  value={newJob.blogs.tone}
                  onChange={(value) =>
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: value } })
                  }
                  className="w-full"
                  aria-label="Select tone of voice"
                >
                  {tones.map((tone) => (
                    <Option key={tone} value={tone}>
                      {tone}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <Select
                  value={newJob.blogs.userDefinedLength}
                  onChange={(value) =>
                    setNewJob({
                      ...newJob,
                      blogs: { ...newJob.blogs, userDefinedLength: parseInt(value) },
                    })
                  }
                  className="w-full"
                  aria-label="Select blog length"
                >
                  {wordLengths.map((length) => (
                    <Option key={length} value={length}>
                      {length} words
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="unsplash"
                      name="imageSource"
                      value="unsplash"
                      checked={newJob.blogs.imageSource === "unsplash"}
                      onChange={(e) =>
                        setNewJob({
                          ...newJob,
                          blogs: { ...newJob.blogs, imageSource: e.target.value },
                        })
                      }
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="unsplash" className="text-sm text-gray-700 whitespace-nowrap">
                      Stock Images
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="ai-generated"
                      name="imageSource"
                      value="ai-generated"
                      checked={newJob.blogs.imageSource === "ai-generated"}
                      onChange={(e) => {
                        if (userPlan !== "free") {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, imageSource: e.target.value },
                          });
                        }
                      }}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label
                      htmlFor="ai-generated"
                      onClick={(e) => {
                        if (userPlan === "free") {
                          e.preventDefault();
                          openUpgradePopup({ featureName: "AI-Generated Images", navigate });
                        }
                      }}
                      className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                    >
                      AI-Generated Images
                      {userPlan === "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="gemini"
                      name="aiModel"
                      value="gemini"
                      checked={newJob.blogs.aiModel === "gemini"}
                      onChange={(e) =>
                        setNewJob({
                          ...newJob,
                          blogs: { ...newJob.blogs, aiModel: e.target.value },
                        })
                      }
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="gemini" className="text-sm text-gray-700">
                      Gemini
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="openai"
                      name="aiModel"
                      value="openai"
                      checked={newJob.blogs.aiModel === "openai"}
                      onChange={(e) => {
                        if (userPlan !== "free") {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, aiModel: e.target.value },
                          });
                        }
                      }}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label
                      htmlFor="openai"
                      onClick={(e) => {
                        if (userPlan === "free") {
                          e.preventDefault();
                          openUpgradePopup({ featureName: "ChatGPT (Open AI)", navigate });
                        }
                      }}
                      className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                    >
                      ChatGPT (Open AI)
                      {userPlan === "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="claude"
                      name="aiModel"
                      value="claude"
                      checked={newJob.blogs.aiModel === "claude"}
                      onChange={(e) => {
                        if (userPlan !== "free" && userPlan !== "basic") {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, aiModel: e.target.value },
                          });
                        }
                      }}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label
                      htmlFor="claude"
                      onClick={(e) => {
                        if (userPlan === "free" || userPlan === "basic") {
                          e.preventDefault();
                          openUpgradePopup({ featureName: "Claude", navigate });
                        }
                      }}
                      className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                    >
                      Claude
                      {(userPlan === "free" || userPlan === "basic") && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Perform Keyword Research?
                <p className="text-xs text-gray-500">
                  Allow AI to find relevant keywords for the topics.
                </p>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="performKeywordResearch"
                  checked={formData.performKeywordResearch}
                  onChange={handleCheckboxChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
              </label>
            </div>
            {!formData.performKeywordResearch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordInput}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddItems(formData.keywordInput, "keywords")
                    }
                    className={`flex-1 px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.keywords ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., digital marketing trends, AI in business"
                    aria-label="Add keyword"
                  />
                  <button
                    onClick={() => handleAddItems(formData.keywordInput, "keywords")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                    aria-label="Add keyword"
                  >
                    <Plus />
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, "keywords")}
                      hidden
                    />
                    <span className="sr-only">Upload CSV for keywords</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {formData.keywords
                    .slice()
                    .reverse()
                    .slice(0, 18)
                    .map((keyword, reversedIndex) => {
                      const actualIndex = formData.keywords.length - 1 - reversedIndex;
                      return (
                        <span
                          key={`${keyword}-${actualIndex}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedKeywords = [...formData.keywords];
                              updatedKeywords.splice(actualIndex, 1);
                              setFormData((prev) => ({ ...prev, keywords: updatedKeywords }));
                              setNewJob((prev) => ({
                                ...prev,
                                blogs: { ...prev.blogs, keywords: updatedKeywords },
                              }));
                            }}
                            className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                            aria-label={`Remove keyword ${keyword}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  {(formData.keywords.length > 18 || recentlyUploadedCount) && (
                    <span className="text-xs font-medium text-blue-600 self-center">
                      {formData.keywords.length > 18 && `+${formData.keywords.length - 18} more `}
                      {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Add FAQ", name: "includeFaqs" },
                { label: "Add Competitive Research", name: "includeCompetitorResearch" },
                { label: "Add InterLinks", name: "includeInterlinks" },
                { label: "WordPress Automatic Posting", name: "wordpressPosting" },
                ...(newJob.options.wordpressPosting
                  ? [{ label: "Table of Content", name: "includeTableOfContents" }]
                  : []),
              ].map(({ label, name }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newJob.options[name]}
                      onChange={handleCheckboxChange}
                      name={name}
                      aria-label={`Toggle ${label.toLowerCase()}`}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 4: Schedule Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select
                  value={newJob.schedule.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setNewJob({
                      ...newJob,
                      schedule: {
                        ...newJob.schedule,
                        type,
                        daysOfWeek: type === "weekly" ? [] : newJob.schedule.daysOfWeek,
                        daysOfMonth: type === "monthly" ? [] : newJob.schedule.daysOfMonth,
                        customDates: type === "custom" ? [] : newJob.schedule.customDates,
                      },
                    });
                    setErrors((prev) => ({
                      ...prev,
                      daysOfWeek: false,
                      daysOfMonth: false,
                      customDates: false,
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Select schedule type"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {newJob.schedule.type === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days of Week
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`px-2 py-1 rounded ${
                          newJob.schedule.daysOfWeek?.includes(i)
                            ? "bg-[#1B6FC9] text-white"
                            : "bg-gray-200 text-gray-700"
                        } ${errors.daysOfWeek ? "border-2 border-red-500" : ""}`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfWeek = prev.schedule.daysOfWeek?.includes(i)
                              ? prev.schedule.daysOfWeek.filter((day) => day !== i)
                              : [...(prev.schedule.daysOfWeek || []), i];
                            return { ...prev, schedule: { ...prev.schedule, daysOfWeek } };
                          });
                          setErrors((prev) => ({ ...prev, daysOfWeek: false }));
                        }}
                        aria-label={`Select ${d} for weekly schedule`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newJob.schedule.type === "monthly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Dates of Month
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                      <button
                        key={date}
                        type="button"
                        className={`px-2 py-1 rounded ${
                          newJob.schedule.daysOfMonth?.includes(date)
                            ? "bg-[#1B6FC9] text-white"
                            : "bg-gray-200 text-gray-700"
                        } ${errors.daysOfMonth ? "border-2 border-red-500" : ""}`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfMonth = prev.schedule.daysOfMonth?.includes(date)
                              ? prev.schedule.daysOfMonth.filter((d) => d !== date)
                              : [...(prev.schedule.daysOfMonth || []), date];
                            return { ...prev, schedule: { ...prev.schedule, daysOfMonth } };
                          });
                          setErrors((prev) => ({ ...prev, daysOfMonth: false }));
                        }}
                        aria-label={`Select date ${date} for monthly schedule`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newJob.schedule.type === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Dates
                  </label>
                  <div className={errors.customDates ? "border-2 border-red-500 rounded-lg" : ""}>
                    <MultiDatePicker
                      value={newJob.schedule.customDates}
                      onChange={(dates) => {
                        setNewJob({
                          ...newJob,
                          schedule: {
                            ...newJob.schedule,
                            customDates: dates,
                            daysOfWeek: [],
                            daysOfMonth: [],
                          },
                        });
                        setErrors((prev) => ({ ...prev, customDates: false }));
                      }}
                      multiple
                      format="YYYY-MM-DD"
                      className="w-full"
                      inputClass="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Select custom dates"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Blogs
                </label>
                <input
                  type="number"
                  value={newJob.blogs.numberOfBlogs}
                  onChange={handleNumberOfBlogsChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.numberOfBlogs ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Enter the number of blogs"
                  aria-label="Number of blogs"
                  min="1"
                  max={MAX_BLOGS}
                />
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

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
    currentStep < 4 && (
      <button
        key="next"
        onClick={() => {
          if (validateSteps(currentStep)) setCurrentStep(currentStep + 1);
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
        onClick={newJob?._id ? () => handleUpdateJob(newJob._id) : handleCreateJob}
        className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
        aria-label={newJob?._id ? "Update job" : "Create job"}
      >
        {newJob?._id ? "Update" : "Create"} Job
      </button>
    ),
  ];

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <div>
          <div className="mb-8">
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Jobs Automation
            </motion.h1>
            <p className="text-gray-600 mt-2">Manage your automated content generation jobs</p>
          </div>
          <motion.div
            whileHover={{ y: -2 }}
            className="w-full md:w-1/2 lg:w-1/3 h-48 p-6 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer mb-8"
            onClick={handleOpenJobModal}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="bg-blue-100 rounded-lg p-3">
                <FiPlus className="w-6 h-6 text-blue-600" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Job</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Set up automated content generation with custom templates and scheduling
              </p>
            </div>
          </motion.div>
          {jobs.length > 0 && (
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Jobs</h2>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(PAGE_SIZE)].map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div
              className="flex flex-col justify-center items-center"
              style={{ minHeight: "calc(100vh - 250px)" }}
            >
              <p className="text-xl text-gray-600">No jobs available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedJobs.map((job) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{job.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {(job._id || "").toString().slice(-6) || "N/A"}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartJob(job._id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.status === "active"
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-green-100 text-green-600 hover:bg-green-200"
                      }`}
                      aria-label={job.status === "active" ? "Stop job" : "Start job"}
                    >
                      {job.status === "active" ? "Stop" : "Start"}
                    </motion.button>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2 capitalize">
                      <FiCalendar className="w-4 h-4 text-blue-500" />
                      <span>Scheduling: {job.schedule.type}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Daily Blogs: {job.blogs.numberOfBlogs}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiSettings className="w-4 h-4 text-green-500" />
                      <span>Model: {job.blogs.aiModel}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiCalendar className="w-4 h-4 text-red-500" />
                      <span>Status: {job.status}</span>
                    </div>
                    {job.blogs.topics?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <FiFileText className="w-4 h-4 text-purple-500 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          Topics:
                          {job.blogs.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.blogs.keywords?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <FiFileText className="w-4 h-4 text-indigo-500 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          Keywords:
                          {job.blogs.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-yellow-500" />
                      <span>
                        Created:{" "}
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Generated Blogs: {(job.createdBlogs || []).length}</span>
                    </div>
                    {job.lastRun && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-yellow-500" />
                        <span>
                          Last Run:{" "}
                          {new Date(job.lastRun).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditJob(job)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                      aria-label="Edit job"
                    >
                      <FiEdit />
                      Edit
                    </motion.button>
                    <Popconfirm
                      title="Delete Job"
                      description="Are you sure you want to delete this job?"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => handleDeleteJob(job._id)}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        aria-label="Delete job"
                      >
                        Delete
                      </motion.button>
                    </Popconfirm>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={jobs.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                responsive
              />
            </div>
          )}
        </div>
      </div>
      <Modal
        title={`Step ${currentStep}: ${
          currentStep === 1
            ? "Select Templates"
            : currentStep === 2
            ? "Job Details"
            : currentStep === 3
            ? "Blog Options"
            : "Schedule Settings"
        }`}
        open={showJobModal}
        onCancel={() => {
          dispatch(closeJobModal());
          setNewJob(initialJob);
          setFormData({ keywords: [], keywordInput: "", performKeywordResearch: false });
          setCurrentStep(1);
          setErrors({});
        }}
        footer={footerButtons}
        width={800}
        centered
        className="custom-modal"
      >
        <div className="p-4 max-h-[80vh] overflow-y-auto">{renderStep()}</div>
      </Modal>
    </>
  );
};

export default Jobs;
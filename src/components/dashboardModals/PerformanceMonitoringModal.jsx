import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Tag, Tags } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Modal, Select, Table, Tooltip, message, Button, Empty } from "antd"
import { InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import { fetchBlogById, fetchBlogStats, fetchBlogs } from "@store/slices/blogSlice"

const PerformanceMonitoringModal = ({ closeFnc, visible }) => {
  const [formData, setFormData] = useState({
    selectedBlog: null,
    title: "",
    content: "",
    keywords: [],
  })
  const [stats, setStats] = useState(null)
  const [id, setId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const { allBlogs, loading: blogLoading } = useSelector(state => state.blog)

  // Fetch blogs when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(fetchBlogs())
    }
  }, [visible, dispatch])

  // Fetch blog details when id changes
  useEffect(() => {
    if (id) {
      setIsLoading(true)
      dispatch(fetchBlogById(id))
        .unwrap()
        .then(response => {
          if (response?._id) {
            setFormData(prev => ({
              ...prev,
              title: response.title || "",
              content: response.content || "",
              keywords: response.focusKeywords || [],
              selectedBlog: response,
              contentType: "markdown",
            }))
          } else {
            message.error("Blog details not found.")
          }
        })
        .catch(error => {
          console.error("Failed to fetch blog by ID:", error)
          message.error("Failed to fetch blog details.")
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, dispatch])

  // Handle blog selection
  const handleBlogSelect = value => {
    const blog = allBlogs?.find(b => b._id === value)
    if (blog) {
      setId(blog._id)
      setFormData({
        selectedBlog: blog,
        title: blog.title || "",
        content: blog.content || "",
        keywords: blog.focusKeywords || [],
      })
      setStats(null)
    }
  }

  // Fetch performance stats on button click
  const handleGetInsights = async () => {
    if (!formData.selectedBlog?._id) {
      message.error("Please select a blog.")
      return
    }
    if (formData.content.length < 500) {
      message.warning("Your content is too short. This may affect performance analysis accuracy.")
      return
    }
    setIsLoading(true)
    try {
      const response = await dispatch(fetchBlogStats(formData.selectedBlog._id)).unwrap()
      setStats(response.stats || response)
      message.success("Performance insights loaded successfully.")
    } catch (error) {
      console.error("Failed to fetch blog stats:", error)
      message.error("Failed to load performance stats.")
    } finally {
      setIsLoading(false)
    }
  }

  const scoreInfo = {
    flesch:
      "📘 Flesch Reading Ease (0–100): Higher is easier to read. Aim for 60+ for general audiences.",
    smog: "📗 SMOG Index: Estimates education level needed to understand. Lower is better (ideal < 10).",
    ari: "📙 ARI (Automated Readability Index): Based on sentence and word length. Lower = easier.",
    seo: "📈 Blog Score: Evaluates keyword use, metadata, and structure. Aim for 80+ for strong SEO.",
  }

  const InfoTooltip = ({ type = "seo" }) => (
    <Tooltip title={scoreInfo[type]} trigger={["hover", "click"]} placement="top">
      <InfoCircleOutlined className="ml-1 text-gray-500 hover:text-blue-500 cursor-pointer" />
    </Tooltip>
  )

  const StatCard = ({ icon, label, value, color, delay = 0, suffix = "", description = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className={`p-4 bg-white rounded-lg border ${color} shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-blue-50 rounded-md text-blue-500">{icon}</div>}
        <div>
          <p className="text-xs sm:text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
            {value}
            {suffix}
          </p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </motion.div>
  )

  const ScoreBox = ({ score, max, label, level, color }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs sm:text-sm font-semibold text-gray-600 flex items-center gap-1">
          {label}
          <InfoTooltip type={/seo/gi.test(label) ? "seo" : "flesch"} />
        </span>
        <span className="text-xs sm:text-sm font-semibold text-gray-600">{level}</span>
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${color} transition-all duration-500`}
            style={{ width: `${(score / max) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs sm:text-sm font-semibold text-gray-600">
            {score} / {max}
          </span>
        </div>
      </div>
    </div>
  )

  const StatsInfoBox = ({ stats }) => {
    if (!stats) return null
    const { readabililty = {}, seo = {}, engagement = {}, metadata = {} } = stats
    const keywordDensity = seo?.keywordDensity || {}

    const shortTailCount = Object.keys(keywordDensity).filter(
      keyword => keyword.split(" ").length <= 2
    ).length
    const longTailCount = Object.keys(keywordDensity).filter(
      keyword => keyword.split(" ").length > 2
    ).length

    const dataSource = Object.entries(keywordDensity).map(
      ([keyword, { count, density }], index) => ({
        key: keyword,
        keyword,
        count,
        density: density,
        animationDelay: index * 0.1,
      })
    )

    const columns = [
      { title: "Keywords", dataIndex: "keyword", key: "keyword", width: "60%", ellipsis: true },
      { title: "Count", dataIndex: "count", key: "count", align: "center", width: "5ch" },
      {
        title: "Density",
        dataIndex: "density",
        key: "density",
        sorter: (a, b) => a.density - b.density,
        render: value => `${value.toFixed(2)}%`,
        align: "center",
        width: "5ch",
      },
    ]

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mt-4 sm:mt-6"
      >
        <div className="mb-4 sm:mb-6 text-center">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Blog Performance Overview</h3>
        </div>
        <div className="mb-6 sm:mb-8 capitalize">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 bg-purple-100 rounded text-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h4 className="text-base sm:text-xl font-semibold text-gray-800">Metadata</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm font-medium text-gray-800 truncate">{metadata?.title || "-"}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Tone</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.tone || "-"}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Template</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.template || "-"}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">AI Model</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.aiModel || "-"}</p>
            </div>
          </div>
          {metadata?.generatedAt && (
            <div className="mt-3 sm:mt-4 bg-gray-50 p-3 rounded-lg border normal-case border-gray-100">
              <p className="text-xs text-gray-500">Generated At</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(metadata.generatedAt).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 bg-blue-100 rounded text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="m11.6 16.8 3.9-2.4 3.9 2.4" />
              </svg>
            </div>
            <h4 className="text-base sm:text-xl font-semibold text-gray-800">SEO</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {Boolean(seo?.score) && (
              <ScoreBox
                score={seo?.score || 0}
                max={100}
                label="Blog Score"
                level={`${seo?.score || 0}/100`}
                color="bg-blue-500"
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                }
                label="Meta Description Length"
                value={seo?.metaDescriptionLength || 0}
                suffix=" characters"
                color="border-blue-100"
                delay={1}
              />
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path d="m10 14 2-2 2 2" />
                    <path d="M12 12v8" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
                label="Internal Links"
                value={seo?.internalLinks || 0}
                color="border-purple-100"
                delay={2}
              />
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                }
                label="External Links"
                value={seo?.externalLinks || 0}
                color="border-indigo-100"
                delay={3}
              />
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Focus Keywords</h5>
            <div className="flex flex-wrap gap-2">
              {seo?.focusKeywords?.map((k, i) => (
                <motion.span
                  key={k}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="px-2 sm:px-3 py-1 bg-blue-50 rounded-full text-xs sm:text-sm text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {k}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Keyword Analysis</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <StatCard
                icon={<Tag className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Short-Tail Keywords"
                value={shortTailCount}
                color="border-blue-100"
                delay={0}
              />
              <StatCard
                icon={<Tags className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Long-Tail Keywords"
                value={longTailCount}
                color="border-blue-100"
                delay={0.1}
              />
            </div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Keyword Densities</h5>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="overflow-x-auto w-full"
            >
              <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                components={{
                  body: {
                    row: ({ children, ...restProps }) => {
                      const delay = dataSource[restProps["data-row-key"]]?.animationDelay || 0
                      return (
                        <motion.tr
                          {...restProps}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay }}
                          className="w-full"
                        >
                          {children}
                        </motion.tr>
                      )
                    },
                  },
                }}
                className="min-w-[300px] sm:min-w-full md:min-w-[600px] lg:min-w-full rounded-md overflow-hidden capitalize"
              />
            </motion.div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 bg-teal-100 rounded text-teal-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h4 className="text-base sm:text-xl font-semibold text-gray-800">Readability</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ScoreBox
              score={readabililty?.fleschEase?.score || 0}
              max={100}
              label="Flesch Ease"
              level={readabililty?.fleschEase?.level || "-"}
              color="bg-teal-500"
            />
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">
                  SMOG Index
                  <InfoTooltip type="smog" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">
                  {readabililty?.smogIndex?.level || "-"}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-2">
                {readabililty?.smogIndex?.score || 0} grade
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">
                  ARI <InfoTooltip type="ari" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">
                  {readabililty?.ari?.level || "-"}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-2">
                {readabililty?.ari?.score || 0} grade
              </p>
            </div>
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Reading Time"
              value={readabililty?.readingTime || 0}
              suffix=" min"
              color="border-teal-100"
              delay={0}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                </svg>
              }
              label="Word Count"
              value={readabililty?.wordCount || 0}
              color="border-amber-100"
              delay={1}
            />
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Sentence Count</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                {readabililty?.sentenceCount || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Avg Sentence Length</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                {readabililty?.avgSentenceLength || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Avg Word Length</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                {readabililty?.avgWordLength || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Syllables</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                {readabililty?.syllableCount || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [visible])

  return (
    <Modal
      title={
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="p-1.5 sm:p-2 bg-blue-500 rounded-md text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3 sm:w-4 sm:h-4"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Performance Dashboard
          </h2>
        </motion.div>
      }
      open={visible}
      onCancel={closeFnc}
      footer={null}
      width="90vw"
      centered
      styles={{
        body: { maxHeight: "80vh", overflowY: "auto" },
        content: { maxWidth: "900px", margin: "0 auto" },
      }}
    >
      <div className="p-0 sm:p-4 space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm sm:text-base font-semibold text-gray-700 mt-2 sm:mt-0 mb-1 sm:mb-2">
            Select Blog
          </label>
          <div className="relative">
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              className="w-full"
              placeholder="Select Blog"
              onChange={handleBlogSelect}
              value={formData.selectedBlog?._id || ""}
              loading={blogLoading}
            >
              <Select.Option value="">Select Blog</Select.Option>
              {allBlogs?.map(blog => (
                <Select.Option key={blog._id} value={blog._id} className="bg-gray-50">
                  {blog.title || "Untitled"}
                </Select.Option>
              ))}
            </Select>
          </div>
        </motion.div>
        {!formData.selectedBlog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-10 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
          >
            <p className="text-sm sm:text-lg text-gray-600">
              Select a blog to view content and performance insights.
            </p>
          </motion.div>
        )}
        {formData.selectedBlog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                  Content Preview
                </h3>
              </div>
              <div className="max-h-[200px] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4 bg-white">
                <div
                  className="prose prose-sm sm:prose-base lg:prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-6 prose-headings:mb-3
                    prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-extrabold prose-h1:leading-tight prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
                    prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:font-bold prose-h2:leading-snug
                    prose-h3:text-lg sm:prose-h3:text-xl prose-h3:font-semibold prose-h3:leading-normal
                    prose-h4:text-base sm:prose-h4:text-lg prose-h4:font-semibold
                    prose-h5:text-sm sm:prose-h5:text-base prose-h5:font-semibold
                    prose-h6:text-sm prose-h6:font-medium prose-h6:text-gray-700
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-3 prose-p:text-sm sm:prose-p:text-base
                    prose-strong:text-gray-900 prose-strong:font-bold
                    prose-em:italic prose-em:text-gray-800
                    prose-ul:list-disc prose-ul:ml-5 prose-ul:my-3 prose-ul:space-y-1
                    prose-ol:list-decimal prose-ol:ml-5 prose-ol:my-3 prose-ol:space-y-1
                    prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-sm sm:prose-li:text-base prose-li:my-1
                    prose-a:text-blue-600 prose-a:underline prose-a:font-medium hover:prose-a:text-blue-800 prose-a:transition-colors
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:my-4
                    prose-code:bg-gray-100 prose-code:text-red-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
                    prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                    prose-hr:border-gray-300 prose-hr:my-6
                    prose-table:border-collapse prose-table:w-full prose-table:my-4
                    prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:text-left prose-th:font-semibold
                    prose-td:border prose-td:border-gray-300 prose-td:p-2
                    first:prose-headings:mt-0
                  "
                  dangerouslySetInnerHTML={{
                    __html:
                      formData?.content?.trim() ||
                      "<p class='text-gray-500 text-center py-8'>No content available for this blog</p>",
                  }}
                />
              </div>
            </motion.div>
            {formData.keywords?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
              >
                <h4 className="text-sm sm:text-md font-semibold text-gray-700 mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, i) => (
                    <motion.span
                      key={keyword}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-2 sm:px-3 py-1 bg-blue-50 rounded-full text-xs sm:text-sm text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      {keyword}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {!stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={handleGetInsights}
                  loading={isLoading}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 sm:px-6 py-2 transition-all duration-200"
                  disabled={isLoading || !formData.selectedBlog}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingOutlined /> Loading Insights...
                    </span>
                  ) : (
                    "Get Performance Insights"
                  )}
                </Button>
              </motion.div>
            )}
            {stats && <StatsInfoBox stats={stats} />}
          </>
        )}
      </div>
    </Modal>
  )
}

export default PerformanceMonitoringModal

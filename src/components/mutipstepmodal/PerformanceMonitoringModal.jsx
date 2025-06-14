import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "@api"
import { useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Table, Tooltip } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"

const PerformanceMonitoringModal = ({ closefnc }) => {
  const [formData, setFormData] = useState({
    selectedBlog: null,
    title: "",
    content: "",
  })
  const [allBlogs, setAllBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [stats, setStats] = useState(null)

  const user = useSelector((state) => state.auth.user)
  const { handlePopup } = useConfirmPopup()

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get("/blogs")
        setAllBlogs(response.data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load blogs")
        setIsLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  const handleBlogSelect = (blog) => {
    setFormData({
      selectedBlog: blog,
      title: blog.title,
      content: blog.content,
    })
    setStats(null)
  }

  const handleAnalyse = async () => {
    if (!formData.selectedBlog) {
      toast.error("Please select a blog")
      return
    }
    // no need for credit
    setIsAnalysing(true)
    try {
      const response = await axiosInstance.get(`/blogs/${formData.selectedBlog._id}/stats`)
      setStats(response.data)
      toast.success("Performance analysis completed!")
    } catch (error) {
      toast.error("Failed to load blog details or deduct credits")
    } finally {
      setIsAnalysing(false)
    }
  }

  const scoreInfo = {
    flesch:
      "📘 Flesch Reading Ease (0–100): Higher is easier to read. Aim for 60+ for general audiences.",
    smog: "📗 SMOG Index: Estimates education level needed to understand. Lower is better (ideal < 10).",
    ari: "📙 ARI (Automated Readability Index): Based on sentence and word length. Lower = easier.",
    seo: "📈 SEO Score: Evaluates keyword use, metadata, and structure. Aim for 80+ for strong SEO.",
  }
  const InfoTooltip = ({ type = "seo" }) => (
    <Tooltip title={scoreInfo[type]} trigger={["hover", "click"]} placement="top">
      <InfoCircleOutlined className="ml-2 text-black size-8 hover:text-blue-500 cursor-pointer" />
    </Tooltip>
  )

  const StatCard = ({ icon, label, value, color, delay = 0, suffix = "", description = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className={`p-4 bg-white rounded-xl border ${color} shadow-sm`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-500">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-800 mt-1">
            {value}
            {suffix}
          </p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </motion.div>
  )

  /**
   *
   * @param {object} param0
   * @param {string} param0.label
   * @returns
   */
  const ScoreBox = ({ score, max, label, level, color }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {label}
          <InfoTooltip type={/seo/gi.test(label) ? "seo" : "flesch"} />
        </span>
        <span className="text-sm font-medium text-gray-600">{level}</span>
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${(score / max) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-sm text-gray-600 font-medium">
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

    // Convert object to array of data
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
      {
        title: "Keywords",
        dataIndex: "keyword",
        key: "keyword",
        width: "60%", // More space for keywords
        ellipsis: true,
      },
      {
        title: "Count",
        dataIndex: "count",
        key: "count",
        align: "center",
        width: "5ch",
      },
      {
        title: "Density",
        dataIndex: "density",
        key: "density",
        sorter: (a, b) => a.density - b.density,
        render: (value) => `${value.toFixed(2)}%`,
        align: "center",
        width: "5ch",
      },
    ]

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-4"
      >
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-800">Blog Performance Overview</h3>
        </div>
        {/* Metadata Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 bg-purple-100 rounded text-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800">Metadata</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm font-medium text-gray-800 truncate">{metadata?.title || "-"}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">Tone</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.tone || "-"}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">Template</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.template || "-"}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">AI Model</p>
              <p className="text-sm font-medium text-gray-800">{metadata?.aiModel || "-"}</p>
            </div>
          </div>

          {metadata?.generatedAt && (
            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Generated At</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(metadata.generatedAt).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
        {/* Engagement Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 bg-green-100 rounded text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 11.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
                <path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                <path d="M6 14v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M18 11v0a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800">Engagement</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
              label="GenWrite Views"
              value={engagement?.views || 0}
              color="border-green-100"
              delay={0}
            />

            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              }
              label="WordPress Views"
              value={engagement?.wordpressViews || 0}
              color="border-green-100"
              delay={1}
            />
          </div>

          <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Public Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  engagement?.isPublic ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {engagement?.isPublic ? "✅ Public" : "❌ Private"}
              </span>
            </div>
          </div>
        </div>
        {/*  SEO Section         */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 bg-blue-100 rounded text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="m11.6 16.8 3.9-2.4 3.9 2.4" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800">SEO</h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ScoreBox
              score={seo?.score || 0}
              max={100}
              label="SEO Score"
              level={`${seo?.score || 0}/100`}
              color="bg-blue-500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Focus Keywords</h5>
            <div className="flex flex-wrap gap-2">
              {seo?.focusKeywords?.map((k, i) => (
                <motion.span
                  key={k}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700 border border-blue-100"
                >
                  {k}
                </motion.span>
              ))}
            </div>
          </div>

          {seo?.keywords.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Other Keywords</h5>
              <div className="flex flex-wrap gap-2">
                {seo?.keywords?.map((k, i) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border border-gray-200"
                  >
                    {k}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Keyword Densities</h5>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
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
                        >
                          {children}
                        </motion.tr>
                      )
                    },
                  },
                }}
                className="rounded-md overflow-hidden"
              />
            </motion.div>
          </div>
        </div>
        {/*         Readability Section         */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 bg-teal-100 rounded text-teal-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800">Readability</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreBox
              score={readabililty?.fleschEase?.score || 0}
              max={100}
              label="Flesch Ease"
              level={readabililty?.fleschEase?.level || "-"}
              color="bg-teal-500"
            />

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  SMOG Index
                  <InfoTooltip type="smog" />
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {readabililty?.smogIndex?.level || "-"}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-2">
                {readabililty?.smogIndex?.score || 0} grade
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  ARI <InfoTooltip type="ari" />
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {readabililty?.ari?.level || "-"}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-2">
                {readabililty?.ari?.score || 0} grade
              </p>
            </div>

            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <StatCard
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                </svg>
              }
              label="Word Count"
              value={readabililty?.wordCount || 0}
              color="border-amber-100"
              delay={1}
            />

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Sentence Count</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {readabililty?.sentenceCount || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Avg Sentence Length</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {readabililty?.avgSentenceLength || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Avg Word Length</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {readabililty?.avgWordLength || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Syllables</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {readabililty?.syllableCount || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Paragraphs</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {readabililty?.paragraphCount || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Performance Dashboard</h2>
          </motion.div>

          <motion.button
            onClick={closefnc}
            className="p-2 rounded-full hover:bg-gray-100 transition-all"
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
          </motion.button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[80vh]">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Blog</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none"
                  onChange={(e) => {
                    const blog = allBlogs.find((b) => b._id === e.target.value)
                    if (blog) handleBlogSelect(blog)
                  }}
                  value={formData.selectedBlog?._id || ""}
                >
                  <option value="" className="bg-gray-50">
                    Select a blog
                  </option>
                  {allBlogs.map((blog) => (
                    <option key={blog._id} value={blog._id} className="bg-gray-50">
                      {blog.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {formData.selectedBlog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700">Preview</h3>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                    {formData.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{formData.content}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              className="flex justify-end pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={handleAnalyse}
                className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 ${
                  isAnalysing
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } transition-all duration-300 shadow`}
                disabled={isAnalysing || !formData.selectedBlog}
                whileHover={{
                  scale: !isAnalysing && formData.selectedBlog ? 1.03 : 1,
                }}
                whileTap={{ scale: 0.97 }}
              >
                {isAnalysing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
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
                    >
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    Analyze Performance
                  </>
                )}
              </motion.button>
            </motion.div>

            {isAnalysing && !stats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="h-32 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </motion.div>
            )}

            <StatsInfoBox stats={stats} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <motion.button
            onClick={closefnc}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Close Dashboard
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceMonitoringModal

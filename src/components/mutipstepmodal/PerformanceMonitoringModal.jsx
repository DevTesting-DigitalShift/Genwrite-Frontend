import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "@api"
import {
  Descriptions,
  Tooltip,
  Tag,
  Statistic,
  Typography,
  Divider,
  Table,
} from "antd"
import {
  InfoCircleOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography

const labelWithInfo = (label, tooltip) => (
  <span className="flex items-center gap-1">
    <Text strong>{label}</Text>
    <Tooltip title={tooltip} placement="top">
      <InfoCircleOutlined className="text-gray-600" />
    </Tooltip>
  </span>
)

/**
 * Props:
 * - stats: {
 *     readabililty: {...},
 *     seo: {...},
 *     engagement: {...},
 *     metadata: {...}
 *   }
 */
const StatsInfoBox = ({ stats }) => {
  if (!stats) return null

  const { readabililty, seo, engagement, metadata } = stats

  // Prepare keyword density table
  const keywordData = Object.entries(seo?.keywordDensity || {}).map(
    ([keyword, { count, density }], idx) => ({
      key: idx,
      keyword,
      count,
      density: `${density}%`,
    })
  )

  const keywordColumns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      render: (text) => <Text code>{text}</Text>,
      width: "50%",
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      width: "25%",
      align: "center",
    },
    {
      title: "Density",
      dataIndex: "density",
      key: "density",
      width: "25%",
      align: "center",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 max-w-3xl mx-auto"
    >
      <Title level={4} className="mb-4 text-center">📊 Blog Performance Overview</Title>

      {/* Metadata */}
      <Divider orientation="left">🧠 Metadata</Divider>
      <Descriptions bordered column={1} size="small" className="mb-6">
        <Descriptions.Item label="Title">{metadata.title}</Descriptions.Item>
        <Descriptions.Item label="Tone">{metadata.tone}</Descriptions.Item>
        <Descriptions.Item label="Template">{metadata.template}</Descriptions.Item>
        <Descriptions.Item label="AI Model">{metadata.aiModel}</Descriptions.Item>
        <Descriptions.Item label="Generated At">{new Date(metadata.generatedAt).toLocaleString('en-IN')}</Descriptions.Item>
        {metadata.wordpressLink && (
          <Descriptions.Item label="WordPress Link">
            <a href={metadata.wordpressLink} target="_blank" rel="noreferrer">
              {metadata.wordpressLink}
            </a>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Engagement */}
      <Divider orientation="left">📈 Engagement</Divider>
      <Descriptions bordered column={2} size="small" className="mb-6">
        <Descriptions.Item label="GenWrite Views">👁️ {engagement.views}</Descriptions.Item>
        <Descriptions.Item label="WordPress Views">📊 {engagement.wordpressViews}</Descriptions.Item>
        <Descriptions.Item label="Public Status">{engagement.isPublic ? "✅ Public" : "❌ Private"}</Descriptions.Item>
        {engagement.isPublic && engagement.publicUrl && (
          <Descriptions.Item label="Public URL">
            <a href={engagement.publicUrl} target="_blank" rel="noreferrer">
              {engagement.publicUrl}
            </a>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* SEO */}
      <Divider orientation="left">🚀 SEO</Divider>
      <Descriptions bordered column={2} size="small" className="mb-6">
        <Descriptions.Item label="SEO Score">
          <Statistic value={seo.score || 0} suffix="/100" valueStyle={{ color: "#52c41a" }} />
        </Descriptions.Item>
        <Descriptions.Item label="Meta Description Length">{seo.metaDescriptionLength} characters</Descriptions.Item>
        <Descriptions.Item label="Internal Links">🔗 {seo.internalLinks}</Descriptions.Item>
        <Descriptions.Item label="External Links">🌐 {seo.externalLinks}</Descriptions.Item>
        <Descriptions.Item label="Focus Keywords">
          {seo.focusKeywords.map(k => <Tag key={k}>{k}</Tag>)}
        </Descriptions.Item>
        <Descriptions.Item label="Other Keywords">
          {seo.keywords.map(k => <Tag key={k} color="blue-inverse">{k}</Tag>)}
        </Descriptions.Item>
      </Descriptions>

      {/* Keyword Density */}
      {keywordData.length > 0 && (
        <>
          <Divider orientation="left">🧾 Keyword Density</Divider>
          <Table
            size="small"
            columns={keywordColumns}
            dataSource={keywordData}
            pagination={false}
            bordered
            scroll={{ x: 400 }}
            className="mb-6"
          />
        </>
      )}

      {/* Readability */}
      <Divider orientation="left">📚 Readability</Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item
          label={labelWithInfo("Flesch Ease", "Ease of reading. Higher = simpler (80+ is best)")}
        >
          <Statistic value={readabililty.fleschEase.score} suffix="/100" valueStyle={{ color: "#1677ff" }} />
          <Tag className="ml-2">{readabililty.fleschEase.level}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={labelWithInfo("SMOG Index", "Grade level required to comprehend")}
        >
          <Statistic value={readabililty.smogIndex.score} suffix=" grade" />
          <Tag className="ml-2">{readabililty.smogIndex.level}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={labelWithInfo("ARI", "Automated Readability Index - grade-based")}
        >
          <Statistic value={readabililty.ari.score} suffix=" grade" />
          <Tag className="ml-2">{readabililty.ari.level}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Reading Time">
          <FieldTimeOutlined className="mr-1" />
          {readabililty.readingTime}
        </Descriptions.Item>

        <Descriptions.Item label="Word Count">📝 {readabililty.wordCount}</Descriptions.Item>
        <Descriptions.Item label="Sentence Count">{readabililty.sentenceCount}</Descriptions.Item>
        <Descriptions.Item label="Avg Sentence Length">{readabililty.avgSentenceLength}</Descriptions.Item>
        <Descriptions.Item label="Avg Word Length">{readabililty.avgWordLength}</Descriptions.Item>
        <Descriptions.Item label="Syllables">{readabililty.syllableCount}</Descriptions.Item>
        <Descriptions.Item label="Paragraphs">{readabililty.paragraphCount}</Descriptions.Item>
      </Descriptions>
    </motion.div>
  )
}



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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAnalyse = async () => {
    if (!formData.selectedBlog) {
      toast.error("Please select a blog")
      return
    }
    setIsAnalysing(true)
    try {
      // Use the main blog details endpoint
      const response = await axiosInstance.get(`/blogs/${formData.selectedBlog._id}/stats`)
      setStats(response.data)
    } catch (error) {
      toast.error("Failed to load blog details")
    } finally {
      setIsAnalysing(false)
    }
  }

  // Helper function to extract colors from gradient string
  const getColorFromGradient = (gradient, index) => {
    const colors = {
      "from-blue-500 to-indigo-600": ["#3b82f6", "#4f46e5"],
      "from-emerald-500 to-teal-600": ["#10b981", "#0d9488"],
      "from-amber-500 to-orange-500": ["#f59e0b", "#f97316"],
      "from-violet-500 to-purple-600": ["#8b5cf6", "#7c3aed"],
      "from-rose-500 to-pink-600": ["#f43f5e", "#db2777"],
      "from-sky-500 to-cyan-500": ["#0ea5e9", "#06b6d4"],
      "from-lime-500 to-green-500": ["#84cc16", "#22c55e"],
      "from-gray-500 to-gray-700": ["#6b7280", "#374151"],
    }

    return colors[gradient]?.[index] || "#3b82f6"
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[800px] bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-white rounded-xl blur-md opacity-20"></div>

        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{
            background: "linear-gradient(45deg, transparent, transparent)",
            opacity: 0,
          }}
          animate={{
            background: [
              "linear-gradient(45deg, transparent, transparent)",
              "linear-gradient(45deg, #3b82f6, #4f46e5)",
              "linear-gradient(45deg, transparent, transparent)",
            ],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
          style={{
            zIndex: -1,
            margin: "-1px",
            border: "1px solid transparent",
          }}
        ></motion.div>

        <div className="flex items-center justify-between p-6 border-b relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
          >
            Performance Monitoring
          </motion.h2>
          <motion.button
            onClick={closefnc}
            className="text-gray-400 hover:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-6 w-6" />
          </motion.button>
        </div>

        <div className="px-6 py-4 overflow-y-auto relative z-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Blog</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 max-h-[200px] overflow-y-auto"
                onChange={(e) => {
                  const blog = allBlogs.find((b) => b._id === e.target.value)
                  if (blog) handleBlogSelect(blog)
                }}
                value={formData.selectedBlog?._id || ""}
              >
                <option value="">Select a blog</option>
                {allBlogs.map((blog) => (
                  <option key={blog._id} value={blog._id}>
                    {blog.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Blog title"
                disabled
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blog Body
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Blog content"
                disabled
              />
            </div> */}

            <div className="flex justify-end">
              <motion.button
                onClick={handleAnalyse}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
                disabled={isAnalysing || !formData.selectedBlog}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isAnalysing ? "Analysing..." : "Analyse"}
              </motion.button>
            </div>

            <StatsInfoBox stats={stats} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t relative z-10">
          <motion.button
            onClick={closefnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceMonitoringModal

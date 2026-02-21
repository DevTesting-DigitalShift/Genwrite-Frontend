import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Tags, X, Activity, Info, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useAllBlogsQuery, useBlogDetailsQuery, useBlogStatsQuery } from "@api/queries/blogQueries"
import toast from "@utils/toast"

const PerformanceMonitoringModal = ({ closeFnc, visible }) => {
  const [formData, setFormData] = useState({
    selectedBlog: null,
    title: "",
    content: "",
    keywords: [],
  })
  const [stats, setStats] = useState(null)
  const [id, setId] = useState(null)
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  // Fetch all blogs
  const { data: allBlogs, isLoading: blogsLoading } = useAllBlogsQuery()

  // Fetch blog details
  const { data: blogDetails, isLoading: detailsLoading } = useBlogDetailsQuery(id)

  const { refetch: fetchStats } = useBlogStatsQuery(id)

  useEffect(() => {
    if (blogDetails && blogDetails._id === id) {
      setFormData(prev => ({
        ...prev,
        title: blogDetails.title || "",
        content: blogDetails.content || "",
        keywords: blogDetails.focusKeywords || [],
        selectedBlog: blogDetails,
        contentType: "markdown",
      }))
    }
  }, [blogDetails, id])

  const handleBlogSelect = e => {
    const value = e.target.value
    if (!value) {
      setId(null)
      setFormData({ selectedBlog: null, title: "", content: "", keywords: [] })
      setStats(null)
      return
    }
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

  const handleGetInsights = async () => {
    if (!formData.selectedBlog?._id) {
      toast.error("Please select a blog.")
      return
    }
    if (formData.content.length < 500) {
      toast.error("Your content is too short. This may affect performance analysis accuracy.")
      return
    }

    setIsStatsLoading(true)
    try {
      const result = await fetchStats()
      if (result.data) {
        setStats(result.data.stats || result.data)
        toast.success("Performance insights loaded successfully.")
      }
    } catch (error) {
      console.error("Failed to fetch blog stats:", error)
      toast.error("Failed to load performance stats.")
    } finally {
      setIsStatsLoading(false)
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
    <div className="tooltip tooltip-top" data-tip={scoreInfo[type]}>
      <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
    </div>
  )

  const StatCard = ({ icon, label, value, color, delay = 0, suffix = "", description = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className={`p-4 bg-white rounded-xl border ${color} shadow-sm hover:shadow-md transition-shadow w-full`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-500">{icon}</div>}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-gray-800 mt-1">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
          </p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </motion.div>
  )

  const ScoreBox = ({ score, max, label, level, color }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {label}
          <InfoTooltip type={/seo/gi.test(label) ? "seo" : "flesch"} />
        </span>
        <span
          className={`badge ${score >= 80 ? "badge-success text-white" : score >= 50 ? "badge-warning text-white" : "badge-error text-white"}`}
        >
          {level}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min((score / max) * 100, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-end">
        <span className="text-sm font-medium text-gray-500">
          <span className="text-gray-900 font-bold">{score}</span> / {max}
        </span>
      </div>
    </div>
  )

  const StatsInfoBox = ({ stats }) => {
    if (!stats) return null
    const { readabililty = {}, seo = {}, metadata = {} } = stats
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

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Metadata Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Activity size={20} />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Metadata Analysis</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Title</p>
              <p className="text-sm font-medium text-gray-900 truncate" title={metadata?.title}>
                {metadata?.title || "-"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tone</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {metadata?.tone || "-"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Template</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {metadata?.template || "-"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Model</p>
              <p className="text-sm font-medium text-gray-900">{metadata?.aiModel || "-"}</p>
            </div>
            {metadata?.generatedAt && (
              <div className="col-span-full bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Generated At</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(metadata.generatedAt).toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Activity size={20} />
            </div>
            <h4 className="text-lg font-bold text-gray-800">SEO Performance</h4>
          </div>

          <div className="space-y-6">
            {Boolean(seo?.score) && (
              <ScoreBox
                score={seo?.score || 0}
                max={100}
                label="Overall SEO Score"
                level={`${seo?.score || 0}/100`}
                color="bg-blue-600"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Meta Desc Length"
                value={seo?.metaDescriptionLength || 0}
                suffix=" chars"
                color="border-blue-100"
                delay={1}
              />
              <StatCard
                label="Internal Links"
                value={seo?.internalLinks || 0}
                color="border-purple-100"
                delay={2}
              />
              <StatCard
                label="External Links"
                value={seo?.externalLinks || 0}
                color="border-indigo-100"
                delay={3}
              />
            </div>

            {/* Keyword Analysis */}
            <div>
              <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Tag size={16} /> Keyword Breakdown
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <StatCard
                  icon={<Tag className="w-4 h-4" />}
                  label="Short-Tail"
                  value={shortTailCount}
                  color="border-gray-100"
                  suffix=" keywords"
                />
                <StatCard
                  icon={<Tags className="w-4 h-4" />}
                  label="Long-Tail"
                  value={longTailCount}
                  color="border-gray-100"
                  suffix=" keywords"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="table w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 text-left">Keyword</th>
                      <th className="py-3 px-4 text-center">Count</th>
                      <th className="py-3 px-4 text-center">Density</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSource.length > 0 ? (
                      dataSource.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">{row.keyword}</td>
                          <td className="py-3 px-4 text-center text-gray-800">{row.count}</td>
                          <td className="py-3 px-4 text-center">
                            <div>
                              {row.density.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-500">
                          No keyword density data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Readability Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
              <Activity size={20} />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Readability Scores</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <ScoreBox
              score={readabililty?.fleschEase?.score || 0}
              max={100}
              label="Flesch Reading Ease"
              level={readabililty?.fleschEase?.level || "-"}
              color="bg-teal-500"
            />
            <StatCard
              label="Reading Time"
              value={readabililty?.readingTime || 0}
              suffix=" min"
              color="border-teal-100"
              icon={<Activity className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">SMOG Index</p>
              <p className="text-lg font-bold text-gray-900">
                {readabililty?.smogIndex?.score || 0}
              </p>
              <p className="text-xs text-gray-500">{readabililty?.smogIndex?.level || "-"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">ARI Score</p>
              <p className="text-lg font-bold text-gray-900">{readabililty?.ari?.score || 0}</p>
              <p className="text-xs text-gray-500">{readabililty?.ari?.level || "-"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Sentences</p>
              <p className="text-lg font-bold text-gray-900">{readabililty?.sentenceCount || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Words</p>
              <p className="text-lg font-bold text-gray-900">{readabililty?.wordCount || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Handle manual scroll lock for modal
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

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={closeFnc}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white">
              <Activity size={15} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Performance Dashboard</h2>
          </div>
          <button
            onClick={closeFnc}
            className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50/30">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Select Blog Post to Analyze
            </label>
            <select
              className="select text-gray-800 w-full h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 outline-0 focus:ring-0 transition-all bg-white"
              onChange={handleBlogSelect}
              value={formData.selectedBlog?._id || ""}
              disabled={blogsLoading}
            >
              <option value="" disabled>
                Select a blog...
              </option>
              {allBlogs?.map(blog => (
                <option key={blog._id} value={blog._id}>
                  {blog.title || "Untitled"}
                </option>
              ))}
            </select>
          </motion.div>

          {!formData.selectedBlog ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Activity size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Blog Selected</h3>
              <p className="text-gray-500 max-w-sm">
                Please select a blog post from the dropdown above to view its content and
                performance insights.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Content Preview</h3>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-6 custom-scrollbar">
                  {detailsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            formData?.content?.trim() ||
                            "<div class='flex flex-col items-center justify-center py-8 text-gray-400'>< AlertCircle class='w-8 h-8 mb-2' /><span>No content available</span></div>",
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {formData.keywords?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                >
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Tag size={16} /> Focus Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, i) => (
                      <motion.span
                        key={keyword}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="badge bg-blue-50 text-blue-600 border-blue-100 px-4 py-2 h-auto"
                      >
                        {keyword}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {!stats ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pt-4 pb-8"
                >
                  <button
                    onClick={handleGetInsights}
                    disabled={isStatsLoading}
                    className="p-4 py-2 rounded-lg bg-blue-500 text-white text-base"
                  >
                    {isStatsLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                      </>
                    ) : (
                      <>
                        Get Performance Insights
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <StatsInfoBox stats={stats} />
              )}
            </>
          )}
        </div>

        {/* Footer Actions if needed, mostly redundant as scroll handles content */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={closeFnc}
            className="btn btn-ghost rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceMonitoringModal

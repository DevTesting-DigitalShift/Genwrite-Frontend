import { useState, useRef, useEffect } from "react"
import {
  Save,
  Plus,
  Sparkles,
  BarChart3,
  Eye,
  Clock,
  ArrowLeft,
  Trash2,
  RefreshCw,
  CheckCircle,
  Search,
  Hash,
  FileText,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

const ManualBlog = () => {
  const navigate = useNavigate()
  const editorRef = useRef()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [seoScore, setSeoScore] = useState(0)
  const [blogScore, setBlogScore] = useState(0)

  // Calculate scores based on content
  useEffect(() => {
    const calculateScores = () => {
      const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length
      const hasTitle = title.length > 0
      const hasKeywords = keywords.length > 0
      const contentLength = content.length

      // SEO Score calculation (0-100)
      let seoPoints = 0
      if (hasTitle) seoPoints += 20
      if (title.length >= 30 && title.length <= 60) seoPoints += 15
      if (hasKeywords) seoPoints += 25
      if (keywords.length >= 3) seoPoints += 10
      if (wordCount >= 300) seoPoints += 20
      if (wordCount >= 1000) seoPoints += 10

      // Blog Score calculation (0-100)
      let blogPoints = 0
      if (hasTitle) blogPoints += 15
      if (contentLength > 100) blogPoints += 20
      if (wordCount >= 500) blogPoints += 25
      if (wordCount >= 1500) blogPoints += 20
      if (hasKeywords) blogPoints += 20

      setSeoScore(Math.min(seoPoints, 100))
      setBlogScore(Math.min(blogPoints, 100))
    }

    calculateScores()
  }, [title, content, keywords])

  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !keywords.find((k) => k.text.toLowerCase() === newKeyword.toLowerCase())
    ) {
      const keyword = {
        id: Date.now().toString(),
        text: newKeyword.trim(),
        difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
        volume: Math.floor(Math.random() * 10000) + 100,
        generated: false,
      }
      setKeywords([...keywords, keyword])
      setNewKeyword("")
    }
  }

  const removeKeyword = (id) => {
    setKeywords(keywords.filter((k) => k.id !== id))
  }

  const generateKeywords = async () => {
    setIsGeneratingKeywords(true)

    // Mock API call for keyword generation
    setTimeout(() => {
      const suggestedKeywords = [
        "content marketing",
        "SEO optimization",
        "digital strategy",
        "blog writing",
        "content creation",
        "online marketing",
      ]

      const newKeywords = suggestedKeywords
        .filter((keyword) => !keywords.find((k) => k.text.toLowerCase() === keyword.toLowerCase()))
        .slice(0, 3)
        .map((keyword) => ({
          id: Date.now().toString() + Math.random(),
          text: keyword,
          difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
          volume: Math.floor(Math.random() * 5000) + 500,
          generated: true,
        }))

      setKeywords([...keywords, ...newKeywords])
      setIsGeneratingKeywords(false)
    }, 2000)
  }

  const saveBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please add both title and content before saving.")
      return
    }

    setSaving(true)

    // Mock save operation
    setTimeout(() => {
      const blogPost = {
        id: Date.now().toString(),
        title,
        content,
        keywords,
        seoScore,
        blogScore,
        createdAt: new Date().toISOString(),
        status: "draft",
        wordCount: content.split(/\s+/).filter((word) => word.length > 0).length,
      }

      // Save to localStorage for demo purposes
      const existingBlogs = JSON.parse(localStorage.getItem("userBlogs") || "[]")
      localStorage.setItem("userBlogs", JSON.stringify([blogPost, ...existingBlogs]))

      setSaving(false)
      setSaveSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
        navigate("/dashboard")
      }, 2000)
    }, 1500)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="flex h-screen">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Blog</h2>
                  <p className="text-gray-600">Write and optimize your content</p>
                </div>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="bg-white border-b border-gray-200 p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your blog title..."
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none"
            />
            <div className="mt-2 text-sm text-gray-500">
              {title.length}/60 characters (optimal for SEO)
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 bg-white p-6">
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your blog content here...

You can write about anything you want. The AI will help you optimize it for SEO and readability.

Tips:
• Use your keywords naturally throughout the content
• Write engaging headlines and subheadings
• Keep paragraphs short and readable
• Add value for your readers"
              className="w-full h-full text-gray-800 placeholder-gray-400 border-none outline-none resize-none text-lg leading-relaxed"
              style={{ minHeight: "calc(100vh - 300px)" }}
            />
          </div>

          {/* Editor Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-6">
                <span>{wordCount} words</span>
                <span>{content.length} characters</span>
                <span>~{Math.ceil(wordCount / 200)} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Blog Editor</h1>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveBlog}
              //   disabled={isSaving || !title.trim() || !content.trim()}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                isSaving || !title.trim() || !content.trim()
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Blog
                </>
              )}
            </button>
          </div>

          {/* Scores Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Performance Scores
            </h3>

            <div className="space-y-4">
              {/* Blog Score */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Blog Score</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(
                      blogScore
                    )}`}
                  >
                    {blogScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      blogScore >= 80
                        ? "bg-green-500"
                        : blogScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${blogScore}%` }}
                  />
                </div>
              </div>

              {/* SEO Score */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">SEO Score</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(
                      seoScore
                    )}`}
                  >
                    {seoScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      seoScore >= 80
                        ? "bg-green-500"
                        : seoScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${seoScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{wordCount}</div>
                <div className="text-xs text-blue-600">Words</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{keywords.length}</div>
                <div className="text-xs text-purple-600">Keywords</div>
              </div>
            </div>
          </div>

          {/* Keywords Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Hash className="w-5 h-5 text-green-600" />
                Keywords
              </h3>
              <button
                onClick={generateKeywords}
                disabled={isGeneratingKeywords}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                title="Generate keyword suggestions"
              >
                {isGeneratingKeywords ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </button>
            </div>

            {/* Add Keyword */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                placeholder="Add keyword..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={addKeyword}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Keywords List */}
            <div className="space-y-2">
              {keywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    keyword.generated
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{keyword.text}</span>
                    <button
                      onClick={() => removeKeyword(keyword.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(
                        keyword.difficulty
                      )}`}
                    >
                      {keyword.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Search className="w-3 h-3" />
                      <span>{keyword.volume.toLocaleString()}</span>
                    </div>
                  </div>
                  {keyword.generated && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <Sparkles className="w-3 h-3" />
                      AI Generated
                    </div>
                  )}
                </div>
              ))}

              {keywords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No keywords added yet</p>
                  <p className="text-xs">Add keywords to improve SEO</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManualBlog

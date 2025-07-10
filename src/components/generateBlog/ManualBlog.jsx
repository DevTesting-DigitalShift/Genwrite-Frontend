import { useState, useEffect } from "react"
import {
  Save,
  Plus,
  Sparkles,
  BarChart3,
  FileText,
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading1,
  Heading3,
  ListOrdered,
  List,
  X,
  RefreshCw,
  CheckCircle,
  Hash,
  Eye,
} from "lucide-react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import Strike from "@tiptap/extension-strike"
import TextAlign from "@tiptap/extension-text-align"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Tooltip, Modal, Spin, message } from "antd"
import Joyride, { STATUS } from "react-joyride"
import Toolbar from "@components/Toolbar"
import { fetchGeneratedTitles } from "@store/slices/blogSlice"
import { packages } from "@constants/templates"

const ManualBlog = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [content, setContent] = useState("")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [seoScore, setSeoScore] = useState(0)
  const [blogScore, setBlogScore] = useState(0)
  const [generatedTitles, setGeneratedTitles] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [runWalkthrough, setRunWalkthrough] = useState(false)

  // Walkthrough steps
  const walkthroughSteps = [
    {
      target: ".topic-input",
      content: "Enter a topic for your blog to help generate relevant titles.",
      disableBeacon: true,
      placement: "top",
    },
    {
      target: ".keywords-section",
      content: "Add at least 4 keywords to optimize your blog for SEO.",
      placement: "top",
    },
  ]

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Strike,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg focus:outline-none min-h-[400px] max-w-full text-gray-800 p-6",
      },
    },
  })

  const getWordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    if (getWordCount(newTitle) <= 60) {
      setTitle(newTitle)
    }
  }

  const handleGenerateTitles = async () => {
    if (!topic.trim() || keywords.length < 4) {
      setRunWalkthrough(true)
      // message.error("Please enter a topic and at least 4 keywords before generating titles.")
      return
    }

    const keywordTexts = keywords.map((k) => k.text.trim()).filter(Boolean)
    setIsGeneratingTitles(true)
    try {
      const result = await dispatch(
        fetchGeneratedTitles({
          keywords: keywordTexts.slice(3),
          focusKeywords: keywordTexts.slice(0, 3),
          topic,
          template: selectedTemplate || "default",
        })
      ).unwrap()
      setGeneratedTitles(result)
    } catch (error) {
      // Error handled in the thunk
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  const handleTitleSelect = (generatedTitle) => {
    setTitle(generatedTitle)
  }

  const addKeyword = () => {
    const input = newKeyword.trim()
    if (!input) return

    const inputKeywords = input
      .split(",")
      .map((k) => k.trim())
      .filter(
        (k) => k && !keywords.some((existing) => existing.text.toLowerCase() === k.toLowerCase())
      )

    if (inputKeywords.length === 0) return

    const newKeywordObjects = inputKeywords.map((k) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: k,
      difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
      volume: Math.floor(Math.random() * 10000) + 100,
      generated: false,
    }))

    setKeywords((prev) => [...prev, ...newKeywordObjects])
    setNewKeyword("")
  }

  const removeKeyword = (id) => {
    setKeywords(keywords.filter((k) => k.id !== id))
  }

  const generateKeywords = async () => {
    setIsGeneratingKeywords(true)
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
      message.error("Please add both title and content before saving.")
      return
    }
    if (getWordCount(title) > 60) {
      message.error("Title exceeds 60 words. Please shorten it.")
      return
    }

    setSaving(true)
    setTimeout(() => {
      const blogPost = {
        id: Date.now().toString(),
        title,
        topic,
        content,
        keywords,
        template: selectedTemplate,
        seoScore,
        blogScore,
        createdAt: new Date().toISOString(),
        status: "draft",
        wordCount: getWordCount(content),
      }

      const existingBlogs = JSON.parse(localStorage.getItem("userBlogs") || "[]")
      localStorage.setItem("userBlogs", JSON.stringify([blogPost, ...existingBlogs]))

      setSaving(false)
      setSaveSuccess(true)

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

  const handlePackageSelect = (index) => {
    setSelectedTemplate(packages[index].name)
  }

  const handleNext = () => {
    if (!selectedTemplate) {
      message.error("Please select a template before proceeding.")
      return
    }
    setCurrentStep(1)
  }

  const handleClose = () => {
    navigate("/blogs")
    setCurrentStep(0)
    setSelectedTemplate(null)
  }

  const handlePreview = () => {
    if (!selectedTemplate) {
      message.error("Please select a template to preview.")
      return
    }
    if (!content.trim()) {
      message.error("Please write some content to preview.")
      return
    }
    setIsPreviewOpen(true)
  }

  const handlePreviewClose = () => {
    setIsPreviewOpen(false)
  }

  // Handle walkthrough completion
  const handleJoyrideCallback = (data) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunWalkthrough(false)
    }
  }

  const generatePreviewContent = () => {
    if (!selectedTemplate || !content.trim()) {
      return `<h1>${title || "Preview Title"}</h1><p>No content available for preview.</p>`
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    const paragraphs = Array.from(doc.querySelectorAll("p")).map((p) => p.textContent)
    const headings = Array.from(doc.querySelectorAll("h1, h2, h3")).map((h) => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent,
    }))

    let previewContent = `<h1>${title || topic || "Your Blog Title"}</h1>`

    switch (selectedTemplate) {
      case "Classic":
        previewContent += `
          <div class="prose">
            ${content}
          </div>
        `
        break
      case "Listicle":
        previewContent += `
          <div class="prose">
            <p>Introduction to your listicle...</p>
            <ol>
              ${paragraphs
                .slice(0, Math.min(paragraphs.length, 5))
                .map((p, i) => `<li><strong>${i + 1}. ${p}</strong></li>`)
                .join("")}
            </ol>
            <h2>Conclusion</h2>
            <p>Summary of the list...</p>
          </div>
        `
        break
      case "Product Review":
        previewContent += `
          <div class="prose">
            <p>Introduction to the product...</p>
            <h2>Pros</h2>
            <ul>
              ${paragraphs
                .slice(0, Math.floor(paragraphs.length / 2))
                .map((p) => `<li>${p}</li>`)
                .join("")}
            </ul>
            <h2>Cons</h2>
            <ul>
              ${paragraphs
                .slice(Math.floor(paragraphs.length / 2))
                .map((p) => `<li>${p}</li>`)
                .join("")}
            </ul>
            <h2>Verdict</h2>
            <p>Final thoughts on the product...</p>
          </div>
        `
        break
      case "How to....":
        previewContent += `
          <div class="prose">
            <p>Introduction to the guide...</p>
            <ol>
              ${paragraphs.map((p, i) => `<li><strong>Step ${i + 1}: ${p}</strong></li>`).join("")}
            </ol>
            <h2>Conclusion</h2>
            <p>Summary of the guide...</p>
          </div>
        `
        break
      case "News Article":
        previewContent += `
          <div class="prose">
            <p>${paragraphs[0] || "Lead paragraph summarizing the news..."}</p>
            <h2>Details</h2>
            ${paragraphs
              .slice(1)
              .map((p) => `<p>${p}</p>`)
              .join("")}
            <h2>Background</h2>
            <p>Context and background information...</p>
          </div>
        `
        break
      case "Opinion Piece":
        previewContent += `
          <div class="prose">
            <p>Introduction to your perspective...</p>
            <h2>Main Argument</h2>
            ${paragraphs
              .slice(0, Math.floor(paragraphs.length / 2))
              .map((p) => `<p>${p}</p>`)
              .join("")}
            <h2>Counterarguments</h2>
            ${paragraphs
              .slice(Math.floor(paragraphs.length / 2))
              .map((p) => `<p>${p}</p>`)
              .join("")}
            <h2>Conclusion</h2>
            <p>Restate your position...</p>
          </div>
        `
        break
      case "Case Study":
        previewContent += `
          <div class="prose">
            <p>Introduction to the case study...</p>
            <h2>Background</h2>
            ${paragraphs
              .slice(0, Math.floor(paragraphs.length / 3))
              .map((p) => `<p>${p}</p>`)
              .join("")}
            <h2>Analysis</h2>
            ${paragraphs
              .slice(Math.floor(paragraphs.length / 3))
              .map((p) => `<p>${p}</p>`)
              .join("")}
            <h2>Conclusion</h2>
            <p>Key takeaways and recommendations...</p>
          </div>
        `
        break
      case "Interview":
        previewContent += `
          <div class="prose">
            <p>Introduction to the interviewee...</p>
            ${paragraphs
              .map(
                (p, i) => `
                <h2>Question ${i + 1}</h2>
                <p>${p}</p>
              `
              )
              .join("")}
            <h2>Conclusion</h2>
            <p>Summary of the interview...</p>
          </div>
        `
        break
      default:
        previewContent += `
          <div class="prose">
            ${content}
          </div>
        `
    }

    return previewContent
  }

  const wordCount = getWordCount(content)
  const titleWordCount = getWordCount(title)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Joyride
        steps={walkthroughSteps}
        run={runWalkthrough}
        continuous
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#1B6FC9",
            textColor: "#1F2937",
            backgroundColor: "#FFFFFF",
            zIndex: 1000,
          },
          buttonNext: {
            backgroundColor: "#1B6FC9",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: "600",
          },
          buttonBack: {
            color: "#1B6FC9",
            borderRadius: "8px",
            padding: "8px 16px",
          },
          buttonSkip: {
            color: "#6B7280",
            fontSize: "14px",
          },
          tooltip: {
            borderRadius: "8px",
            padding: "16px",
            // boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
        }}
        locale={{
          back: "Previous",
          next: "Next",
          skip: "Skip Tour",
          last: "Finish",
        }}
      />
      <Modal
        title="Select Template"
        open={currentStep === 0}
        onCancel={handleClose}
        footer={[
          <button
            key="next"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
            aria-label="Proceed to next step"
          >
            Next
          </button>,
        ]}
        width={800}
        centered
      >
        <div className="p-3">
          <div className="flex gap-4 overflow-x-auto py-2 px-1">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`min-w-[200px] cursor-pointer transition-all duration-200 ${
                  selectedTemplate === pkg.name ? "border-gray-300 border-2 rounded-lg" : ""
                }`}
                onClick={() => handlePackageSelect(index)}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 mt-2">
                    <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="Blog Preview"
        open={isPreviewOpen}
        onCancel={handlePreviewClose}
        footer={[
          <button
            key="close"
            onClick={handlePreviewClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:bg-gray-700"
            aria-label="Close preview"
          >
            Close
          </button>,
        ]}
        width={800}
        centered
      >
        <div
          className="prose max-w-none p-4"
          dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
        />
      </Modal>

      {currentStep === 1 && (
        <div className="flex flex-col lg:flex-row h-screen">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Editor Header */}
            <header className="bg-white shadow-md border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Create New Blog</h2>
                      <p className="text-gray-600 text-sm">Write and optimize your content</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90 flex items-center"
                    aria-label="Preview blog"
                  >
                    <Eye size={16} className="mr-2" />
                    Preview
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter your blog title..."
                    className={`flex-1 text-2xl sm:text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none ${
                      titleWordCount > 60 ? "text-red-600" : ""
                    }`}
                    aria-label="Blog title"
                  />
                  <button
                    onClick={handleGenerateTitles}
                    disabled={isGeneratingTitles}
                    className="px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90 flex items-center"
                    aria-label="Generate titles"
                  >
                    {isGeneratingTitles ? (
                      <Spin size="small" />
                    ) : (
                      <Sparkles size={16} className="mr-2" />
                    )}
                    Generate Titles
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {titleWordCount}/60 words (optimal for SEO)
                  {titleWordCount > 60 && (
                    <span className="text-red-600 ml-2">Title exceeds 60 words</span>
                  )}
                </div>
                {generatedTitles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {generatedTitles.map((generatedTitle, index) => {
                      const isSelected = generatedTitle === title
                      return (
                        <div key={index} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleTitleSelect(generatedTitle)}
                            className={`px-3 py-1 rounded-full text-sm border transition truncate max-w-[200px] sm:max-w-[300px] ${
                              isSelected
                                ? "bg-[#1B6FC9] text-white border-[#1B6FC9]"
                                : "bg-gray-100 text-gray-700 border-gray-300 opacity-60 hover:opacity-100 hover:bg-gray-200"
                            }`}
                            aria-label={`Select title: ${generatedTitle}`}
                          >
                            {generatedTitle}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </header>

            {/* Content Editor */}
            <Toolbar editor={editor} />
            <div className="flex-1 overflow-y-auto bg-white p-6 shadow-lg">
              {editor && (
                <BubbleMenu
                  editor={editor}
                  tippyOptions={{ duration: 100 }}
                  className="flex gap-2 bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                >
                  <Tooltip title="Bold">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={
                        editor.isActive("bold")
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Italic">
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={
                        editor.isActive("italic")
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Strikethrough">
                    <button
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={
                        editor.isActive("strike")
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Heading 1">
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={
                        editor.isActive("heading", { level: 1 })
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Heading 2">
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={
                        editor.isActive("heading", { level: 2 })
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Heading 3">
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={
                        editor.isActive("heading", { level: 3 })
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Bullet List">
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={
                        editor.isActive("bulletList")
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle bullet list"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Ordered List">
                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={
                        editor.isActive("orderedList")
                          ? "p-2 rounded bg-blue-100 text-blue-700"
                          : "p-2 rounded hover:bg-gray-200 text-gray-600"
                      }
                      aria-label="Toggle ordered list"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Blog Editor</h1>
              </div>
              <button
                onClick={saveBlog}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSaving || !title.trim() || !content.trim() || titleWordCount > 60
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                }`}
                disabled={isSaving || !title.trim() || !content.trim() || titleWordCount > 60}
                aria-label="Save blog"
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

            <div className="p-6 pt-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance Scores
              </h3>
              <div className="space-y-4">
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

            <div className="flex-1 p-6 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Topic
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter blog topic..."
                  className="topic-input w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  aria-label="Blog topic"
                />
              </div>
              <div className="keywords-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-green-600" />
                    Keywords
                  </h3>
                  <Tooltip title="Regenerate using keywords">
                    <button
                      onClick={generateKeywords}
                      disabled={isGeneratingKeywords}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                      aria-label="Generate keyword suggestions"
                    >
                      {isGeneratingKeywords ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Optimize
                    </button>
                  </Tooltip>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    aria-label="Add new keyword"
                  />
                  <button
                    onClick={addKeyword}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Add keyword"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 max-h-64 overflow-y-auto sm:overflow-x-auto sm:flex-nowrap">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] break-words"
                    >
                      <span className="truncate">{keyword.text}</span>
                      <button
                        onClick={() => removeKeyword(keyword.id)}
                        className="ml-2 text-white hover:text-red-200 transition-colors p-1"
                        aria-label={`Remove keyword ${keyword.text}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {keywords.length === 0 && (
                  <div className="text-center text-gray-500">
                    {/* <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" /> */}
                    <p className="text-sm">No keywords added yet</p>
                    <p className="text-xs">Add keywords to improve SEO</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManualBlog
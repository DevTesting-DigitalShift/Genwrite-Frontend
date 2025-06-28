import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../../api"
import { fetchBlogById, updateBlogById } from "../../store/slices/blogSlice"
import TextEditor from "../generateBlog/TextEditor"
import TextEditorSidebar from "../generateBlog/TextEditorSidebar"
import { Loader2 } from "lucide-react"
import { Helmet } from "react-helmet"
import { sendRetryLines } from "@api/blogApi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { message } from "antd"

const ToolBox = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const blog = useSelector((state) => state.blog.selectedBlog)
  const [activeTab, setActiveTab] = useState("normal")
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState([])
  const [editorContent, setEditorContent] = useState("")
  const [proofreadingResults, setProofreadingResults] = useState([])
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveContent, setSaveContent] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPosted, setIsPosted] = useState(null)
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchBlogById(id))
    }
  }, [id, dispatch])

  useEffect(() => {
    if (blog?.keywords) {
      setKeywords(blog.keywords)
    }
  }, [blog?.keywords])

  useEffect(() => {
    setIsLoading(true)
    if (blog) {
      setEditorContent(blog.content ?? "")
      setIsLoading(false)
    } else {
      setEditorContent("")
      setIsLoading(false)
    }
  }, [blog])

  const blogToDisplay = blog

  const handleReplace = (original, change) => {
    if (typeof original !== "string" || typeof change !== "string") {
      console.error("Invalid types passed to handleReplace:", { original, change })
      message.error("Something went wrong while applying suggestion.")
      return
    }

    let updatedContent = editorContent
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    updatedContent = updatedContent.replace(regex, change)
    setEditorContent(updatedContent)

    setProofreadingResults((prev) => prev.filter((s) => s.original !== original))
  }

  const handlePostToWordPress = async () => {
    setIsPosting(true)
    if (!blogToDisplay?.title) {
      message.error("Blog title is missing.")
      return
    }

    const previewContainer = document.querySelector(".markdown-body")
    const content = previewContainer?.innerHTML || editorContent

    if (!content || content.trim() === "" || content === "<p></p>" || content === "<p><br></p>") {
      message.error("Editor content is empty. Please add some content before posting.")
      return
    }

    const postData = {
      blogId: blogToDisplay._id,
      includeTableOfContents: true,
    }

    const key = "wordpress-posting"

    message.loading({
      content: "Posting to WordPress...",
      key,
      duration: 0, // Don't auto-close
    })

    try {
      const response = await axiosInstance.post("/wordpress/post", postData)

      setIsPosted(response?.data)

      if (response?.data) {
        setIsPosting(false)
      }

      message.success({
        content: "Blog posted successfully!",
        key,
        duration: 3,
      })
    } catch (error) {
      let errorMessage = "Failed to post to WordPress"
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      message.error({
        content: `WordPress posting failed: ${errorMessage}`,
        key,
        duration: 5,
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await dispatch(
        updateBlogById({
          id: blog._id,
          title: blog?.title,
          content: editorContent,
          published: blog?.published,
          focusKeywords: blog?.focusKeywords,
          keywords,
        })
      )
      const res = await sendRetryLines(blog._id)
      if (res.data) {
        setSaveContent(res.data) // Store the response content
        setSaveModalOpen(true) // Show the modal
        message.success("Review the suggested content.")
      } else {
        message.error("No content received from retry.")
      }
    } catch (error) {
      console.error("Error updating the blog:", error)
      message.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAcceptSave = () => {
    if (saveContent) {
      setEditorContent(saveContent) // Replace entire editor content
      message.success("Content updated successfully!")
    }
    setSaveModalOpen(false)
    setSaveContent(null)
  }

  const handleRejectSave = () => {
    setSaveModalOpen(false)
    setSaveContent(null)
    message.info("Changes discarded.")
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }
  return (
    <>
      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div className="h-full">
        <div className="max-w-8xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Save Response Modal */}
          {saveModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Suggested Content</h3>
                <div className="p-4 bg-gray-50 rounded-md mb-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    className="prose"
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    }}
                  >
                    {saveContent}
                  </ReactMarkdown>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleRejectSave}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b text-center space-y-4">
              <h1 className="text-2xl font-bold text-gray-800">Blog Editor</h1>
              <div className="flex space-x-2">
                {["normal", "markdown", "html"].map((tab) => (
                  <motion.button
                    key={tab}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab(tab)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-grow h-[80vh]">
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={tabVariants}
                  transition={{ duration: 0.3 }}
                  className="flex-grow w-1/2"
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                    </div>
                  ) : (
                    <TextEditor
                      keywords={keywords}
                      setKeywords={setKeywords}
                      blog={blogToDisplay}
                      activeTab={activeTab}
                      proofreadingResults={proofreadingResults}
                      handleReplace={handleReplace}
                      content={editorContent}
                      setContent={setEditorContent}
                      isSavingKeyword={isSaving}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <TextEditorSidebar
                blog={blogToDisplay}
                keywords={keywords}
                setKeywords={setKeywords}
                onPost={handlePostToWordPress}
                activeTab={activeTab}
                handleReplace={handleReplace}
                proofreadingResults={proofreadingResults}
                setProofreadingResults={setProofreadingResults}
                content={editorContent}
                handleSave={handleSave}
                posted={isPosted}
                isPosting={isPosting}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ToolBox

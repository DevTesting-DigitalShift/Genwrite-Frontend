import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../../api"
import { toast, ToastContainer } from "react-toastify"
import { fetchBlogById } from "../../store/slices/blogSlice"
import TextEditor from "../generateBlog/TextEditor"
import TextEditorSidebar from "../generateBlog/TextEditorSidebar"
import { Loader2 } from "lucide-react"
import { Helmet } from "react-helmet"

const ToolBox = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const blog = useSelector((state) => state.blog.selectedBlog)
  const [activeTab, setActiveTab] = useState("normal")
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState([])
  const [editorContent, setEditorContent] = useState("") // Initialize with empty string
  const [proofreadingResults, setProofreadingResults] = useState([])

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
      toast.error("Something went wrong while applying suggestion.")
      return
    }

    let updatedContent = editorContent
    console.log(updatedContent)
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    updatedContent = updatedContent.replace(regex, change)
    setEditorContent(updatedContent)

    setProofreadingResults((prev) => prev.filter((s) => s.original !== original))
    // toast.success("Suggestion applied successfully!")
  }

  const handlePostToWordPress = async () => {
    if (!blogToDisplay?.title) {
      toast.error("Blog title is missing.")
      return
    }

    const previewContainer = document.querySelector(".markdown-body")
    const content = previewContainer?.innerHTML || editorContent

    if (!content || content.trim() === "" || content === "<p></p>" || content === "<p><br></p>") {
      toast.error("Editor content is empty. Please add some content before posting.")
      return
    }

    const processedContent = content.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, (match, src) => {
      return `<div style="max-width: 600px; margin: 2rem auto; text-align: center;">
          <img src="${src}" alt="Blog image" style="max-width: 100%; height: auto; display: block; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
        </div>`
    })

    const postData = {
      id: blogToDisplay._id,
      content: processedContent,
    }

    const postingToastId = toast.info("Posting to WordPress...", { autoClose: false })

    try {
      const response = await axiosInstance.post("/wordpress/post", postData)

      if (response.status === 200) {
        toast.update(postingToastId, {
          render: "Post submitted successfully! (Check WordPress)",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        })
      } else {
        toast.update(postingToastId, {
          render: response.data?.message || "Successfully posted to WordPress!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        })
      }
    } catch (error) {
      let errorMessage = "Failed to post to WordPress"

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.update(postingToastId, {
        render: `WordPress posting failed: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
    }
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <>
      <Helmet>
        <title>Toolbox | GenWrite</title>
      </Helmet>
      <ToastContainer />
      <div className="h-full">
        <div className="max-w-8xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
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
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ToolBox

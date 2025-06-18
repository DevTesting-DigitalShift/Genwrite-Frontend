import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import TextEditor from "../generateBlog/TextEditor"
import TextEditorSidebar from "../generateBlog/TextEditorSidebar"
import SmallBottomBox from "./SmallBottomBox"
import { useDispatch, useSelector } from "react-redux" // Assuming you're using Redux
import { fetchBlogById } from "../../store/slices/blogSlice" // Adjust path as needed
import axiosInstance from "../../api"

const ToolBox = () => {
  const location = useLocation()
  const [blogId, setBlogId] = useState(null)
  const dispatch = useDispatch()
  const blog = useSelector((state) => state.blog.selectedBlog)

  // Retrieve blog from location state
  const blogFromLocation = location.state?.blog

  useEffect(() => {
    // Create a URLSearchParams object from the query string
  }, [location.search])

  useEffect(() => {
    if (blogId && blogFromLocation) {
      // Fetch the blog data when blogId changes and no blog from location
      dispatch(fetchBlogById(blogId))
    }
  }, [blogId, dispatch, blogFromLocation])

  return (
    <div className="flex flex-col h-screen">
      {/* Optional Header */}
      {/* <Header /> */}

      <div className="flex flex-grow overflow-hidden">
        {/* Editor Section */}
        <main className="flex-grow overflow-y-auto px-6 py-4 max-w-5xl w-full mx-auto">
          <TextEditor blog={blogToDisplay} />
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[300px] p-4 border-l overflow-y-auto bg-white shadow-inner">
          <TextEditorSidebar />
        </aside>
      </div>

      {/* Bottom Toolbar */}
      <footer>
        <SmallBottomBox />
      </footer>
    </div>
  )
}

export default ToolBox

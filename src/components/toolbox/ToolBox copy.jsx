import React, { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import Header from "../generateBlog/Header";
import TextEditor from "../generateBlog/TextEditor";
import TextEditorSidebar from "../generateBlog/TextEditorSidebar";
import SmallBottomBox from "./SmallBottomBox";
import { useDispatch, useSelector } from 'react-redux'; // Assuming you're using Redux
import { fetchBlogById } from '../../store/slices/blogSlice'; // Adjust path as needed
import MarkUpBlog from "../generateBlog/MarkUpBlog";
import RichTextEditor from "../generateBlog/Sample";
import axiosInstance from "../../api";

const ToolBox = () => {
  const location = useLocation();
  const [blogId, setBlogId] = useState(null);
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog);

  // Retrieve blog from location state
  const blogFromLocation = location.state?.blog;

  useEffect(() => {
    // Create a URLSearchParams object from the query string
   
  }, [location.search]);

  useEffect(() => {
    if (blogId && blogFromLocation) {
      console.log("api to fetch bloig hittong")
      // Fetch the blog data when blogId changes and no blog from location
      dispatch(fetchBlogById(blogId));
    }
  }, [blogId, dispatch, blogFromLocation]);

  // Determine which blog to use
  const blogToDisplay = blogFromLocation || blog;
  console.log("blog")
  console.log(blogId)
  const queryParams = new URLSearchParams(location.search);
  // Retrieve the 'blogId' parameter
  const id = queryParams.get('blogId');
  setBlogId(id);
console.log("api ")
  const response = axiosInstance.get(`/blogs/${blogId}`);
     console.log("API response for getBlogById:", response.data);
console.log(first)
  return (
    <>
      <div className="">



        <div className="flex flex-col h-screen">
          {/* <Header /> */}
          <div className="flex flex-grow ">
            <div className="">
              <TextEditor blog={blogToDisplay} />
            </div>
            <div>
              <TextEditorSidebar />
            </div>
          </div>
        </div>

        <div>
          <SmallBottomBox />
        </div>
      </div>

      {/* <h1 className="text-3xl font-bold ">markup blog content</h1>
    <MarkUpBlog blog={blogToDisplay}/> 
    <RichTextEditor blog={blogToDisplay}/>  */}
    </>

  );
};

export default ToolBox;

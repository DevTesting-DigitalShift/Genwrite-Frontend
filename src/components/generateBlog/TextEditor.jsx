import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { motion } from "framer-motion";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import axiosInstance from "../../api";
import AnimatedContent from "./AnimatedContent";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid';

const TextEditor = ({ blog, activeTab, keywords, setKeywords }) => {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const initialContent = blog?.content || "";
    setContent(initialContent);
    setShowPreview(false);
    setHasAnimated(false);
    if (initialContent && !isAnimating) {
      setIsAnimating(true);
    } else if (!initialContent) {
      setIsAnimating(false);
    }
  }, [blog, activeTab]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setHasAnimated(true);
    if (blog?.content) {
      setContent(blog.content);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axiosInstance.put(`/blogs/update/${blog._id}`, {
        title: blog?.title,
        content: content,
        published: blog?.published,
        focusKeywords: blog?.focusKeywords,
        keywords,
      });
      if (response.data && response.data.content) {
        setContent(response.data.content);
      }
    } catch (error) {
      console.error("Error updating the blog:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContentArea = () => {
    if (isAnimating && blog?.content) {
      return (
        <div className="h-[calc(100vh-200px)] md:w-[936px] p-4 overflow-y-auto bg-white">
          <AnimatedContent
            content={blog.content}
            onComplete={handleAnimationComplete}
          />
        </div>
      );
    }

    if (showPreview && (activeTab === 'markdown' || activeTab === 'html')) {
      return (
        <div className="h-[calc(100vh-200px)] md:w-[936px] p-6 border rounded-md overflow-y-auto bg-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl lg:text-4xl font-bold text-center my-8" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl lg:text-3xl font-bold mt-10 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl lg:text-2xl font-bold mt-8 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="my-4 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4" {...props} />,
              li: ({node, ...props}) => <li className="my-1" {...props} />,
              a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 hover:underline" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
              img: ({node, ...props}) => (
                <img
                  className="max-w-sm mx-auto my-6 rounded-md shadow-md"
                  alt={props.alt || ''}
                  {...props}
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    switch (activeTab) {
      case "normal":
        return (
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={TextEditor.modules}
            formats={TextEditor.formats}
            className="h-[calc(100vh-200px)] md:w-[936px] overflow-y-auto bg-white border rounded-lg"
          />
        );
      case "markdown":
        return (
          <SimpleMDE
            value={content}
            onChange={setContent}
            options={{
              autofocus: true, spellChecker: false, status: false,
              minHeight: "calc(100vh - 200px)", minWidth: "936px",
              toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image"],
            }}
            className="h-[calc(100vh-200px)] md:w-[936px] p-4 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
          />
        );
      case "html":
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100vh-200px)] md:w-[936px] p-4 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
            placeholder="Enter raw HTML/Markdown here..."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-grow p-4 relative -top-16">
      <div className="flex justify-end pr-10 items-center mb-4">
        {(activeTab === 'markdown' || activeTab === 'html') && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center px-3 py-1.5 rounded-md text-base font-medium mr-4 transition-colors focus:outline-none ${
              showPreview
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            title={showPreview ? "Back to Editor" : "Show Preview"}
          >
            {showPreview ? <EyeOffIcon className="w-5 h-5 mr-1.5" /> : <EyeIcon className="w-5 h-5 mr-1.5" />}
            {showPreview ? "Editor" : "Preview"}
          </button>
        )}

        <motion.button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving || isAnimating}
        >
          {isSaving ? (
            <motion.span
              className="inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⟳
            </motion.span>
          ) : (
            "Save"
          )}
        </motion.button>
      </div>
      {renderContentArea()}
    </div>
  );
};

TextEditor.modules = {
  toolbar: [
    [{ font: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

TextEditor.formats = [
  "font",
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
  "video",
];

export default TextEditor;

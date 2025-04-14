import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { motion } from "framer-motion";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import axiosInstance from "../../api";

const TextEditor = ({ blog, activeTab, keywords, setKeywords }) => {
  const [content, setContent] = useState(blog?.content || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (blog?.content) {
      setContent(blog.content);
    }
  }, [blog]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axiosInstance.put(`/blogs/update/${blog._id}`, {
        title: blog.title,
        content: content,
        published: blog.published,
        focusKeywords: blog.focusKeywords,
        keywords,
      });
      console.log("Blog updated successfully:", response.data);
      if (response.data && response.data) {
        setContent(response.data.content);
      }
    } catch (error) {
      console.error("Error updating the blog:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditor = () => {
    switch (activeTab) {
      case "normal":
        return (
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={TextEditor.modules}
            formats={TextEditor.formats}
            className="h-[calc(100vh-200px)] overflow-y-auto"
          />
        );
      case "markdown":
        return (
          <SimpleMDE
            value={content}
            onChange={setContent}
            options={{
              autofocus: true,
              spellChecker: false,
              minHeight: "calc(100vh - 200px)",
            }}
          />
        );
      case "html":
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100vh-200px)] p-4 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your HTML here..."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-grow p-4">
      <div className="flex justify-end pr-10 items-center mb-4">
        <motion.button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
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
      {renderEditor()}
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

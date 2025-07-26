import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Save, Sparkles, BarChart3, FileText, Bold, Italic, Strikethrough, Heading2, Heading1, Heading3, ListOrdered, List, X, RefreshCw, CheckCircle, Hash, Eye, Image as ImageIcon, Plus } from "lucide-react";
import { Tooltip, Modal, message, Input } from "antd";
import Joyride, { STATUS } from "react-joyride";
import SmartSidebar from "./SmartSidebar";
import RichTextEditor from "./RichTextEditor";
import { createManualBlog, updateBlogById, fetchBlogById, clearSelectedBlog } from "@store/slices/blogSlice";
import TemplateModal from "./TemplateModal";

const ManualBlog = () => {
  const { id } = useParams(); // Get the blog ID from URL params
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog || {}); // Fetch blog from Redux store

  // Initialize states
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(!id); // Show modal only for new blogs (no ID)
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [blogScore, setBlogScore] = useState(0);
  const [runWalkthrough, setRunWalkthrough] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [blogId, setBlogId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    tone: "Informative",
    focusKeywords: [],
    keywords: [],
    userDefinedLength: 1200,
    focusKeywordInput: "",
    keywordInput: "",
    template: "",
  });
  const [errors, setErrors] = useState({
    title: false,
    topic: false,
    tone: false,
    focusKeywords: false,
    keywords: false,
    userDefinedLength: false,
    template: false,
  });
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reset states and fetch blog data based on ID
  useEffect(() => {
    if (id) {
      dispatch(fetchBlogById(id));
      setShowTemplateModal(false);
    } else {
      dispatch(clearSelectedBlog());
      setShowTemplateModal(true);
      setTitle("");
      setTopic("");
      setContent("");
      setKeywords([]);
      setSeoScore(0);
      setBlogScore(0);
      setBlogId("");
      setFormData({
        title: "",
        topic: "",
        tone: "Informative",
        focusKeywords: [],
        keywords: [],
        userDefinedLength: 1200,
        focusKeywordInput: "",
        keywordInput: "",
        template: "",
      });
      setErrors({
        title: false,
        topic: false,
        tone: false,
        focusKeywords: false,
        keywords: false,
        userDefinedLength: false,
        template: false,
      });
    }
  }, [id, dispatch]);

  // Update states when blog data is fetched
  useEffect(() => {
    if (blog._id && id) {
      setTitle(blog.title || "");
      setTopic(blog.topic || "");
      setContent(blog.content || "");
      setKeywords(
        blog.focusKeywords?.map((k, idx) => ({
          id: `${Date.now()}-${idx}`,
          text: k,
          difficulty: "medium",
          volume: 1000,
          generated: false,
        })) || []
      );
      setSeoScore(blog.seoScore || 0);
      setBlogScore(blog.blogScore || 0);
      setBlogId(blog._id || "");
      setFormData({
        title: blog.title || "",
        topic: blog.topic || "",
        tone: blog.tone || "Informative",
        focusKeywords: blog.focusKeywords || [],
        keywords: blog.keywords || [],
        userDefinedLength: blog.userDefinedLength || 1200,
        focusKeywordInput: "",
        keywordInput: "",
        template: blog.template || "",
      });
    }
  }, [blog, id]);

  // Calculate word count, read time, and unsaved changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter((word) => word.length > 0).length;
    setWordCount(words);
    setReadTime(Math.ceil(words / 200));
    const hasChanges = title !== "" || content !== "";
    setHasUnsavedChanges(hasChanges);
  }, [title, content]);

  // Handle beforeunload event for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Done save save it first";
      }
    };
    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const finalKeywords = keywords.length > 0 ? keywords : [];
  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  const handleSubmit = async () => {
    const blogData = {
      title: formData.title?.trim(),
      topic: formData.topic?.trim(),
      tone: formData.tone?.trim(),
      focusKeywords: formData.focusKeywords,
      keywords: formData.keywords,
      userDefinedLength: Number(formData.userDefinedLength),
      template: formData.template,
    };

    const newErrors = {};
    if (!blogData.title) newErrors.title = true;
    if (!blogData.topic) newErrors.topic = true;
    if (!blogData.tone) newErrors.tone = true;
    if (!blogData.template) newErrors.template = true;
    if (!blogData.userDefinedLength || blogData.userDefinedLength <= 0) newErrors.userDefinedLength = true;
    if (!blogData.focusKeywords || blogData.focusKeywords.length === 0) newErrors.focusKeywords = true;
    if (!blogData.keywords || blogData.keywords.length === 0) newErrors.keywords = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      message.error("Please fill all required fields correctly.");
      return;
    }

    try {
      const res = await dispatch(createManualBlog(blogData)).unwrap();
      setBlogId(res._id);
      setShowTemplateModal(false);
      navigate(`/blog-editor/${res._id}`);
    } catch (err) {
      console.error("Failed to create blog:", err);
      message.error(err?.message || "Failed to create blog");
    }
  };

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
  ];

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (getWordCount(newTitle) <= 60) {
      setTitle(newTitle);
      setFormData((prev) => ({ ...prev, title: newTitle }));
    }
  };

  const addKeyword = () => {
    const input = newKeyword.trim();
    if (!input) return;

    const inputKeywords = input
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && !keywords.some((existing) => existing.text.toLowerCase() === k.toLowerCase()));

    if (inputKeywords.length === 0) return;

    const newKeywordObjects = inputKeywords.map((k) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: k,
      difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
      volume: Math.floor(Math.random() * 10000) + 100,
      generated: false,
    }));

    setKeywords((prev) => [...prev, ...newKeywordObjects]);
    setNewKeyword("");
    setFormData((prev) => ({
      ...prev,
      focusKeywords: [...newKeywordObjects.slice(0, 3).map((k) => k.text), ...prev.focusKeywords],
      keywords: [...newKeywordObjects.slice(3).map((k) => k.text), ...prev.keywords],
    }));
  };

  const removeKeyword = (id) => {
    const removedKeyword = keywords.find((k) => k.id === id);
    setKeywords(keywords.filter((k) => k.id !== id));
    setFormData((prev) => ({
      ...prev,
      focusKeywords: prev.focusKeywords.filter((k) => k !== removedKeyword.text),
      keywords: prev.keywords.filter((k) => k !== removedKeyword.text),
    }));
  };

  const generateKeywords = async () => {
    setIsGeneratingKeywords(true);
    setTimeout(() => {
      const suggestedKeywords = [
        "content marketing",
        "SEO optimization",
        "digital strategy",
        "blog writing",
        "content creation",
        "online marketing",
      ];

      const newKeywords = suggestedKeywords
        .filter((keyword) => !keywords.find((k) => k.text.toLowerCase() === keyword.toLowerCase()))
        .slice(0, 3)
        .map((keyword) => ({
          id: Date.now().toString() + Math.random(),
          text: keyword,
          difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
          volume: Math.floor(Math.random() * 5000) + 500,
          generated: true,
        }));

      setKeywords([...keywords, ...newKeywords]);
      setFormData((prev) => ({
        ...prev,
        focusKeywords: [...newKeywords.slice(0, 3).map((k) => k.text), ...prev.focusKeywords],
        keywords: [...newKeywords.slice(3).map((k) => k.text), ...prev.keywords],
      }));
      setIsGeneratingKeywords(false);
    }, 2000);
  };

  const saveBlog = async () => {
    if (!title.trim() || !content.trim()) {
      message.error("Please add both title and content before saving.");
      return;
    }
    if (getWordCount(title) > 60) {
      message.error("Title exceeds 60 words. Please shorten it.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await dispatch(
        updateBlogById({
          id: blogId || id,
          title,
          content,
          published: blog.published || false,
          focusKeywords: keywords.slice(0, 3).map((k) => k.text),
          keywords: keywords.slice(3).map((k) => k.text),
        })
      ).unwrap();

      if (response) {
        message.success("Blog updated successfully");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1000);
        if (!id && response._id) navigate(`/blog-editor/${response._id}`);
      }
    } catch (error) {
      console.error("Error updating the blog:", error);
      message.error("Failed to save blog.");
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handlePreview = () => {
    if (!content.trim()) {
      message.error("Please write some content to preview.");
      return;
    }
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => setIsPreviewOpen(false);

  const handleOpenImageModal = () => {
    setIsImageModalOpen(true);
    setImageUrl("");
    setImageAltText("");
  };

  const handleImageModalSave = () => {
    if (!imageUrl.trim()) {
      message.error("Please enter an image URL.");
      return;
    }

    const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;
    if (!urlPattern.test(imageUrl)) {
      message.error("Please enter a valid image URL (e.g., ending with .png, .jpg, etc.).");
      return;
    }

    if (RichTextEditor.editor) {
      RichTextEditor.editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: imageUrl,
            alt: imageAltText.trim() || "User uploaded image",
            title: imageAltText.trim() || "User uploaded image",
          },
        })
        .run();
    } else {
      message.error("Editor is not initialized. Please try again.");
    }

    setIsImageModalOpen(false);
    setImageUrl("");
    setImageAltText("");
  };

  const handleImageModalCancel = () => {
    setIsImageModalOpen(false);
    setImageUrl("");
    setImageAltText("");
  };

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) setRunWalkthrough(false);
  };

  const generatePreviewContent = () => {
    if (!content.trim()) return `<h1>${title || "Preview Title"}</h1><p>No content available for preview.</p>`;
    return `<div class="prose prose-lg"><h1>${title || topic || "Your Blog Title"}</h1>${content}</div>`;
  };

  const handleTemplateModalClose = () => {
    const isEmpty =
      !formData.title?.trim() ||
      !formData.topic?.trim() ||
      !formData.tone?.trim() ||
      !formData.template ||
      !formData.userDefinedLength ||
      formData.userDefinedLength <= 0 ||
      !formData.focusKeywords ||
      formData.focusKeywords.length === 0 ||
      !formData.keywords ||
      formData.keywords.length === 0;

    if (isEmpty && !id) navigate("/blogs");
    setShowTemplateModal(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 transition-colors duration-300 mt-4">
      <style>
        {`
          .ProseMirror a { color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important; }
          .ProseMirror img { max-width: 100%; height: auto; display: block; margin: 1rem 0; }
          .prose a { color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important; }
          .prose img { max-width: 100%; height: auto; display: block; margin: 1rem 0; }
        `}
      </style>
      <Joyride
        steps={walkthroughSteps}
        run={runWalkthrough}
        continuous
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: { primaryColor: "#1B6FC9", textColor: "#1F2937", backgroundColor: "#FFFFFF", zIndex: 1000 },
          buttonNext: { backgroundColor: "#1B6FC9", borderRadius: "8px", padding: "8px 16px", fontWeight: "600" },
          buttonBack: { color: "#1B6FC9", borderRadius: "8px", padding: "8px 16px" },
          buttonSkip: { color: "#6B7280", fontSize: "14px" },
          tooltip: { borderRadius: "8px", padding: "16px" },
        }}
        locale={{ back: "Previous", next: "Next", skip: "Skip Tour", last: "Finish" }}
      />
      <Modal
        title="Add Image"
        open={isImageModalOpen}
        onOk={handleImageModalSave}
        onCancel={handleImageModalCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
        centered
        okButtonProps={{ className: "bg-[#1b6fc9] text-white hover:bg-[#1b6fc9]/90 border-none" }}
        cancelButtonProps={{ className: "bg-gray-200 text-gray-800 hover:bg-gray-300 border-none" }}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <Input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Image URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Alt Text</label>
            <Input
              type="text"
              value={imageAltText}
              onChange={(e) => setImageAltText(e.target.value)}
              placeholder="Enter alt text for the image"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Image alt text"
            />
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
          className="prose prose-lg max-w-none p-4"
          dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
        />
      </Modal>
      <TemplateModal
        closeFnc={handleTemplateModalClose}
        isOpen={showTemplateModal}
        handleSubmit={handleSubmit}
        errors={errors}
        setErrors={setErrors}
        formData={formData}
        setFormData={setFormData}
      />
      {!showTemplateModal && (
        <div className="flex h-screen">
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white shadow-md border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {id ? "Edit Blog" : "Create New Blog"}
                    </h2>
                    <p className="text-gray-600 text-sm">Write and optimize your content</p>
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
                  <button
                    onClick={saveBlog}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSaving || !title.trim() || !content.trim() || getWordCount(title) > 60
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                    }`}
                    disabled={isSaving || !title.trim() || !content.trim() || getWordCount(title) > 60}
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
              </div>
              <div className="mt-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter your blog title..."
                    className={`flex-1 text-2xl sm:text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none ${
                      getWordCount(title) > 60 ? "text-red-600" : ""
                    }`}
                    aria-label="Blog title"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {getWordCount(title)}/60 words (optimal for SEO)
                  {getWordCount(title) > 60 && (
                    <span className="text-red-600 ml-2">Title exceeds 60 words</span>
                  )}
                </div>
              </div>
            </header>
            <RichTextEditor
              title={title}
              content={content}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onOpenImageModal={handleOpenImageModal}
            />
          </div>
          <SmartSidebar
            isExpanded={isSidebarExpanded}
            onToggle={toggleSidebar}
            wordCount={wordCount}
            readTime={readTime}
            title={title}
            content={content}
            keywords={keywords}
            addKeyword={addKeyword}
            removeKeyword={removeKeyword}
            generateKeywords={generateKeywords}
            isGeneratingKeywords={isGeneratingKeywords}
            newKeyword={newKeyword}
            setNewKeyword={setNewKeyword}
            seoScore={seoScore}
            blogScore={blogScore}
            getScoreColor={getScoreColor}
          />
        </div>
      )}
    </div>
  );
};

export default ManualBlog;
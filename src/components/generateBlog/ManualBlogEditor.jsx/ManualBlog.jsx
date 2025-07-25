import { useState, useEffect } from "react";
import {
  Save,
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
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Strike from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, Modal, message, Input } from "antd";
import Joyride, { STATUS } from "react-joyride";
import Toolbar from "@components/Toolbar";
import { createManualBlog, updateBlogById, fetchBlogById, clearSelectedBlog } from "@store/slices/blogSlice";
import TemplateModal from "./TemplateModal";

const ManualBlog = () => {
  const { id } = useParams(); // Get the blog ID from URL params
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog || {}); // Fetch blog from Redux store

  // Initialize states
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

  // Reset states and fetch blog data based on ID
  useEffect(() => {
    if (id) {
      // Editing mode: Fetch blog data
      dispatch(fetchBlogById(id));
      setShowTemplateModal(false);
    } else {
      // New blog mode: Clear Redux state and reset form
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

  const finalKeywords = keywords.length > 0 ? keywords : [];

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
    if (!blogData.userDefinedLength || blogData.userDefinedLength <= 0)
      newErrors.userDefinedLength = true;
    if (!blogData.focusKeywords || blogData.focusKeywords.length === 0)
      newErrors.focusKeywords = true;
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
      navigate(`/blog-editor/${res._id}`); // Navigate to edit mode after creation
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
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: content, // Use content state instead of blog.content
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg focus:outline-none min-h-[400px] max-w-full text-gray-800 p-6",
      },
    },
  });

  const getWordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
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
      .filter(
        (k) => k && !keywords.some((existing) => existing.text.toLowerCase() === k.toLowerCase())
      );

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
        setTimeout(() => {
          setSaveSuccess(false);
        }, 1000);
        if (!id && response._id) {
          navigate(`/blog-editor/${response._id}`);
        }
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

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

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

    if (editor) {
      editor
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
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunWalkthrough(false);
    }
  };

  const generatePreviewContent = () => {
    if (!content.trim()) {
      return `<h1>${title || "Preview Title"}</h1><p>No content available for preview.</p>`;
    }

    return `
      <div class="prose prose-lg">
        <h1>${title || topic || "Your Blog Title"}</h1>
        ${content}
      </div>
    `;
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

    if (isEmpty && !id) {
      navigate("/blogs");
    }
    setShowTemplateModal(false);
  };

  const wordCount = getWordCount(content);
  const titleWordCount = getWordCount(title);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <style>
        {`
          .ProseMirror a {
            color: #2563eb !important;
            text-decoration: underline !important;
            cursor: pointer !important;
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem 0;
          }
          .prose a {
            color: #2563eb !important;
            text-decoration: underline !important;
            cursor: pointer !important;
          }
          .prose img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem 0;
          }
        `}
      </style>
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
        title="Add Image"
        open={isImageModalOpen}
        onOk={handleImageModalSave}
        onCancel={handleImageModalCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
        centered
        okButtonProps={{
          className: "bg-[#1b6fc9] text-white hover:bg-[#1b6fc9]/90 border-none",
        }}
        cancelButtonProps={{
          className: "bg-gray-200 text-gray-800 hover:bg-gray-300 border-none",
        }}
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
        <div className="flex flex-col lg:flex-row h-screen">
          <div className="flex-1 flex flex-col">
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
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {titleWordCount}/60 words (optimal for SEO)
                  {titleWordCount > 60 && (
                    <span className="text-red-600 ml-2">Title exceeds 60 words</span>
                  )}
                </div>
              </div>
            </header>
            <Toolbar editor={editor} onOpenImageModal={handleOpenImageModal} />
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
                          ? "p-2 rounded bg-[#1B6FC9] text-blue-700"
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
              {blog.images && blog.images.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Images</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {blog.images.map((image) => (
                      <div key={image.id} className="bg-gray-50 p-4 rounded-lg">
                        <img
                          src={image.url}
                          alt={image.altText}
                          className="w-full h-auto rounded-md mb-2"
                        />
                        <p className="text-sm text-gray-600">
                          {image.altText}
                          <br />
                          Photo by{" "}
                          <a
                            href={image.attribution.profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            {image.attribution.name}
                          </a>{" "}
                          on{" "}
                          <a
                            href="https://www.pexels.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            Pexels
                          </a>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                disabled={
                  isSaving ||
                  !title.trim() ||
                  !content.trim() ||
                  titleWordCount > 60
                }
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
                    className="p-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                    aria-label="Add keyword"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 max-h-64 overflow-y-auto sm:overflow-x-auto sm:flex-nowrap">
                  {finalKeywords.map((keyword) => (
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
                {finalKeywords.length === 0 && (
                  <div className="text-center text-gray-500">
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
  );
};

export default ManualBlog;
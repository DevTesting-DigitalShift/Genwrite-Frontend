import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { motion } from "framer-motion";
import axiosInstance from "../../api";
import AnimatedContent from "./AnimatedContent";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import ChatBox from "./ChatBox";
import {
  Eye,
  EyeOff,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Type,
  MessageSquare,
} from "lucide-react";

import { marked } from 'marked';
import TurndownService from "turndown";

const FONT_OPTIONS = [
  { label: "Inter", value: "font-sans" },
  { label: "Serif", value: "font-serif" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
];

const TextEditor = ({ blog, activeTab, keywords, setKeywords }) => {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini");
  const htmlEditorRef = useRef(null);
  const mdEditorRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const dropdownRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const AI_MODELS = [
    { id: "gemini", name: "Gemini", icon: "" },
    { id: "openai", name: "OpenAI", icon: "" },
    { id: "grok", name: "Grok", icon: "" },
  ];

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .font-comic { font-family: "Comic Sans MS", cursive; }
      .prose { max-width: none !important; }
    `;

    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Link.configure({
          HTMLAttributes: { class: "text-blue-600 underline" },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg mx-auto my-4 max-w-[800px] w-full h-auto object-contain",
            style: "display: block; margin: 2rem auto;",
          },
        }),
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ],
      content: content,
      onUpdate: ({ editor }) => setContent(editor.getHTML()),
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] opacity-100 ${selectedFont} blog-content`,
        },
      },
    },
    [activeTab, selectedFont]
  );

  useEffect(() => {
    if (normalEditor) {
      setEditorReady(true);
      return () => {
        if (!normalEditor.isDestroyed) {
          normalEditor.destroy();
        }
      };
    }
  }, [normalEditor]);

  useEffect(() => {
    const initialContent = blog?.content || "";
    setContent(initialContent);

    if (normalEditor && !normalEditor.isDestroyed) {
      normalEditor.commands.setContent(marked.parse(initialContent));
      console.log(marked.parse(initialContent))
    }

    setShowPreview(false);

    if (initialContent && !hasAnimated && !hasInitializedRef.current) {
      setIsAnimating(true);
      hasInitializedRef.current = true;
    } else {
      setIsAnimating(false);
    }
  }, [blog, normalEditor, activeTab]);

  useEffect(() => {
    if (activeTab === "html" && !showPreview) {
      Prism.highlightAll();
    }
  }, [content, activeTab, showPreview]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setHasAnimated(true);
    if (blog?.content) setContent(blog.content);
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
      if (response.data?.content) setContent(response.data.content);
    } catch (error) {
      console.error("Error updating the blog:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelection = (e) => {
    const textarea = e.target;
    if (textarea.selectionStart !== textarea.selectionEnd) {
      const rect = textarea.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setSelectionPosition({
        top: rect.top + scrollTop - 40,
        left: rect.left + 10,
      });
    } else {
      setSelectionPosition(null);
    }
  };

  const FloatingToolbar = ({ editorRef, mode }) => {
    if (!selectionPosition || !editorRef.current) return null;

    const formatActions = {
      markdown: [
        { icon: <Bold className="w-5 h-5" />, action: () => insertText("**", "**", editorRef) },
        { icon: <Italic className="w-5 h-5" />, action: () => insertText("*", "*", editorRef) },
        {
          icon: <LinkIcon className="w-5 h-5" />,
          action: () => insertText("[", "](url)", editorRef),
        },
        {
          icon: <ImageIcon className="w-5 h-5" />,
          action: () => insertText("![alt](", ")", editorRef),
        },
      ],
      html: [
        {
          icon: <Bold className="w-5 h-5" />,
          action: () => insertText("<strong>", "</strong>", editorRef),
        },
        {
          icon: <Italic className="w-5 h-5" />,
          action: () => insertText("<em>", "</em>", editorRef),
        },
        {
          icon: <LinkIcon className="w-5 h-5" />,
          action: () => insertText('<a href="url">', "</a>", editorRef),
        },
        {
          icon: <ImageIcon className="w-5 h-5" />,
          action: () => insertText('<img src="', '" alt="description" />', editorRef),
        },
      ],
    };

    return (
      <motion.div
        className="absolute flex gap-2 bg-white shadow-lg p-2 rounded border z-50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={selectionPosition}
      >
        {formatActions[mode].map((action, index) => (
          <button key={index} onClick={action.action}>
            {action.icon}
          </button>
        ))}
      </motion.div>
    );
  };

  const insertText = (before, after = "", editorRef) => {
    const textarea = editorRef?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newValue = text.substring(0, start) + before + selectedText + after + text.substring(end);
    textarea.value = newValue;
    setContent(newValue);

    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    setSelectionPosition(null);
  };

  const FontDropdown = () => (
    <select
      value={selectedFont}
      onChange={(e) => setSelectedFont(e.target.value)}
      className="p-2 rounded border bg-white hover:bg-gray-100"
    >
      {FONT_OPTIONS.map((font) => (
        <option key={font.value} value={font.value}>
          {font.label}
        </option>
      ))}
    </select>
  );

  const ModelDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowModelDropdown(!showModelDropdown)}
        className="flex items-center gap-2 font-bold mr-4 hover:bg-gray-100 p-2 rounded"
      >
        GenWrite
      </button>

      {showModelDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[200px]"
        >
          {AI_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setShowModelDropdown(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${
                selectedModel === model.id ? "bg-gray-50" : ""
              }`}
            >
              <span>{model.icon}</span>
              <span>{model.name}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );

  const renderToolbar = () => (
    <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50 items-center">
      <ModelDropdown />
      <FontDropdown />

      {[1, 2, 3].map((level) => (
        <button
          key={level}
          onClick={() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().toggleHeading({ level }).run();
            } else if (activeTab === "html") {
              insertText(`<h${level}>`, `</h${level}>`, htmlEditorRef);
            } else {
              insertText(`${"#".repeat(level)} `, "", mdEditorRef);
            }
          }}
          className={`p-2 rounded hover:bg-gray-100 ${
            activeTab === "normal" && normalEditor?.isActive("heading", { level })
              ? "bg-gray-200"
              : ""
          }`}
        >
          {level === 1 && <Heading1 className="w-5 h-5" />}
          {level === 2 && <Heading2 className="w-5 h-5" />}
          {level === 3 && <Heading3 className="w-5 h-5" />}
        </button>
      ))}

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().toggleBold().run();
          } else if (activeTab === "html") {
            insertText("<strong>", "</strong>", htmlEditorRef);
          } else {
            insertText("**", "**", mdEditorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("bold") ? "bg-gray-200" : ""
        }`}
      >
        <Bold className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().toggleItalic().run();
          } else if (activeTab === "html") {
            insertText("<em>", "</em>", htmlEditorRef);
          } else {
            insertText("*", "*", mdEditorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("italic") ? "bg-gray-200" : ""
        }`}
      >
        <Italic className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().setTextAlign("left").run();
          } else {
            const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef;
            insertText('<div style="text-align: left;">', "</div>", editorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "left" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().setTextAlign("center").run();
          } else {
            const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef;
            insertText('<div style="text-align: center;">', "</div>", editorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "center" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignCenter className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().setTextAlign("right").run();
          } else {
            const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef;
            insertText('<div style="text-align: right;">', "</div>", editorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "right" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignRight className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().toggleBulletList().run();
          } else if (activeTab === "html") {
            insertText("<ul>\n<li>", "</li>\n</ul>", htmlEditorRef);
          } else {
            insertText("- ", "", mdEditorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("bulletList") ? "bg-gray-200" : ""
        }`}
      >
        <List className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          if (activeTab === "normal") {
            normalEditor.chain().focus().toggleOrderedList().run();
          } else if (activeTab === "html") {
            insertText("<ol>\n<li>", "</li>\n</ol>", htmlEditorRef);
          } else {
            insertText("1. ", "", mdEditorRef);
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("orderedList") ? "bg-gray-200" : ""
        }`}
      >
        <ListOrdered className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          const url = prompt("Enter URL");
          if (url) {
            if (activeTab === "normal") {
              normalEditor.chain().focus().setLink({ href: url }).run();
            } else if (activeTab === "html") {
              insertText(`<a href="${url}">`, "</a>", htmlEditorRef);
            } else {
              insertText("[", `](${url})`, mdEditorRef);
            }
          }
        }}
        className="p-2 rounded hover:bg-gray-100"
      >
        <LinkIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          const url = prompt("Enter Image URL");
          if (url) {
            if (activeTab === "normal") {
              normalEditor.chain().focus().setImage({ src: url }).run();
            } else if (activeTab === "html") {
              insertText(
                `<img src="${url}" alt="description" class="max-w-full my-4 rounded-lg mx-auto" />`,
                "",
                htmlEditorRef
              );
            } else {
              insertText(`![Image](${url})`, "", mdEditorRef);
            }
          }
        }}
        className="p-2 rounded hover:bg-gray-100"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => normalEditor?.chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-100"
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => normalEditor?.chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-100"
      >
        <Redo2 className="w-5 h-5" />
      </button>
    </div>
  );

  const renderContentArea = () => {
    if (!editorReady)
      return <div className="h-[calc(100vh-200px)] md:w-[1030px] p-4">Loading editor...</div>;

    if (isAnimating && blog?.content) {
      return (
        <div className="h-[calc(100vh-200px)] md:w-[1030px] p-4 overflow-y-auto bg-white">
          <AnimatedContent content={blog.content} onComplete={handleAnimationComplete} />
        </div>
      );
    }

    if (showPreview && (activeTab === "markdown" || activeTab === "html")) {
      return (
        <div
          className={`h-[calc(100vh-200px)] md:w-[1030px] p-6 border rounded-md overflow-y-auto bg-white ${selectedFont}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl lg:text-4xl font-bold text-center my-8" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl lg:text-3xl font-bold mt-10 mb-4" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl lg:text-2xl font-bold mt-8 mb-3" {...props} />
              ),
              p: ({ node, ...props }) => <p className="my-4 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-4" {...props} />,
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:text-blue-800 hover:underline" {...props} />
              ),
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              img: ({ node, ...props }) => (
                <img
                  className="max-w-sm mx-auto my-6 rounded-md shadow-md"
                  alt={props.alt || ""}
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
          <div className="h-[calc(100vh-200px)] md:w-[1030px] overflow-y-auto bg-white border rounded-lg">
            {normalEditor && (
              <BubbleMenu
                editor={normalEditor}
                tippyOptions={{ duration: 100 }}
                className="flex gap-2 bg-white shadow-lg p-2 rounded border"
              >
                <button onClick={() => normalEditor.chain().focus().toggleBold().run()}>
                  <Bold className="w-5 h-5" />
                </button>
                <button onClick={() => normalEditor.chain().focus().toggleItalic().run()}>
                  <Italic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => normalEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 className="w-5 h-5" />
                </button>
              </BubbleMenu>
            )}
            <EditorContent editor={normalEditor} />
          </div>
        );

      case "markdown":
        return (
          <div className="h-[calc(100vh-200px)] md:w-[1030px] overflow-y-auto bg-white border rounded-lg relative">
            <textarea
              ref={mdEditorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`w-full h-full p-4 text-sm focus:outline-none resize-none bg-white ${selectedFont}`}
              placeholder="Enter Markdown here..."
            />
            <FloatingToolbar editorRef={mdEditorRef} mode="markdown" />
          </div>
        );

      case "html":
        return (
          <div className="h-[calc(100vh-200px)] md:w-[1030px] overflow-y-auto bg-white border rounded-lg relative">
            <textarea
              ref={htmlEditorRef}
              value={marked.parse(content).replace(/>(\s*)</g, '>\n<')}
              onChange={(e) => {
                const text = e.target.value;
                const turndownService = new TurndownService();
                const markdown = turndownService.turndown(text);
                setContent(markdown)
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full font-mono text-sm p-4 focus:outline-none resize-none bg-white text-black"
              placeholder="<h1>HTML Title</h1>\n<p>Paragraph with <a href='https://example.com'>link</a></p>\n<img src='image.jpg' alt='description' />"
              style={{ whiteSpace: "pre-wrap" }}
            />
            <FloatingToolbar editorRef={htmlEditorRef} mode="html" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-grow p-4 relative -top-16">
      <div className="flex justify-end pr-10 items-center mb-4">
        {(activeTab === "markdown" || activeTab === "html") && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center px-3 py-1.5 rounded-md text-base font-medium mr-4 transition-colors focus:outline-none ${
              showPreview
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {showPreview ? (
              <EyeOff className="w-5 h-5 mr-1.5" />
            ) : (
              <Eye className="w-5 h-5 mr-1.5" />
            )}
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
      {renderToolbar()}
      {renderContentArea()}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default TextEditor;

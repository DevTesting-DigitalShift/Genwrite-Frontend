import React, { useEffect, useCallback, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { Modal, Button, Input, Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import { lazy, Suspense } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import Loading from "@components/Loading";
import { BubbleMenu } from "@tiptap/extension-bubble-menu"

const ContentDiffViewer = lazy(() => import("../ContentDiffViewer"));

const MarkdownEditor = ({ content, onChange, className }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let view;
    if (containerRef.current) {
      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });
      view = new EditorView({ state, parent: containerRef.current });
    }
    return () => view?.destroy();
  }, [content, onChange]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
};

const HtmlEditor = ({ content, onChange, className }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let view;
    if (containerRef.current) {
      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          html(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });
      view = new EditorView({ state, parent: containerRef.current });
    }
    return () => view?.destroy();
  }, [content, onChange]);

  return <div ref={containerRef} className={`h-screen ${className}`} />;
};

const EditorContentArea = ({
  activeTab,
  normalEditor,
  safeContent,
  htmlContent,
  setContent,
  setHtmlContent,
  setUnsavedChanges,
  proofreadingResults,
  handleReplace,
  isEditorLoading,
  editorReady,
  blog,
  humanizedContent,
  showDiff,
  handleAcceptHumanizedContent,
  handleAcceptOriginalContent,
  editorContent,
  markdownPreview,
  selectedFont,
  linkModalOpen,
  setLinkModalOpen,
  linkUrl,
  setLinkUrl,
  imageModalOpen,
  setImageModalOpen,
  imageUrl,
  setImageUrl,
  imageAlt,
  setImageAlt,
  editImageModalOpen,
  setEditImageModalOpen,
  selectedImage,
  setSelectedImage,
  retryModalOpen,
  setRetryModalOpen,
  originalContent,
  setOriginalContent,
  retryContent,
  setRetryContent,
  selectionRange,
  setSelectionRange,
  tabSwitchWarning,
  setTabSwitchWarning,
  markdownToHtml,
  htmlToMarkdown,
  activeSpan,
  bubbleRef,
  applyChange,
  rejectChange,
}) => {
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkPreviewPos, setLinkPreviewPos] = useState(null);
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(null);
  const [linkPreviewElement, setLinkPreviewElement] = useState(null);
  const hideTimeout = useRef(null);

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl || !/https?:\/\//i.test(linkUrl)) {
      message.error("Enter a valid URL.");
      return;
    }
    if (normalEditor) {
      const { from, to } = normalEditor.state.selection;
      normalEditor
        .chain()
        .focus()
        .setLink({ href: linkUrl, target: "_blank", rel: "noopener noreferrer" })
        .setTextSelection({ from, to })
        .run();
      setLinkModalOpen(false);
      message.success("Link added.");
    }
  }, [linkUrl, normalEditor, setLinkModalOpen]);

  const handleConfirmImage = useCallback(() => {
    if (!imageUrl || !/https?:\/\//i.test(imageUrl)) {
      message.error("Enter a valid image URL.");
      return;
    }
    if (imageUrl.includes("<script") || imageUrl.includes("</script")) {
      message.error("Script tags are not allowed in image URLs.");
      return;
    }
    if (activeTab === "Normal" && normalEditor) {
      const { from } = normalEditor.state.selection;
      normalEditor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: imageAlt })
        .setTextSelection(from)
        .run();
      setImageModalOpen(false);
      message.success("Image added.");
    } else if (activeTab === "Markdown") {
      message.success("Image added.");
      setImageModalOpen(false);
    } else if (activeTab === "HTML") {
      message.success("Image added.");
      setImageModalOpen(false);
    }
  }, [imageUrl, imageAlt, normalEditor, activeTab, setImageModalOpen]);

  const handleImageClick = useCallback((event) => {
    if (event.target.tagName === "IMG") {
      const { src, alt } = event.target;
      setSelectedImage({ src, alt: alt || "" });
      setImageAlt(alt || "");
      setEditImageModalOpen(true);
    }
  }, [setSelectedImage, setImageAlt, setEditImageModalOpen]);

  const handleDeleteImage = useCallback(() => {
    if (!selectedImage) return;
    if (activeTab === "Normal" && normalEditor) {
      let deleted = false;
      normalEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          normalEditor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + 1 })
            .run();
          deleted = true;
        }
      });
      if (deleted) {
        setEditImageModalOpen(false);
        setSelectedImage(null);
        setImageAlt("");
        setUnsavedChanges(true);
      } else {
        message.error("Failed to delete image.");
      }
    } else if (activeTab === "Markdown") {
      const markdownImageRegex = new RegExp(
        `!\\[${escapeRegExp(selectedImage.alt || "")}\\]\\(${escapeRegExp(selectedImage.src)}\\)`,
        "g"
      );
      setContent((prev) => {
        const newContent = prev.replace(markdownImageRegex, "");
        setUnsavedChanges(true);
        return newContent;
      });
      setEditImageModalOpen(false);
      setSelectedImage(null);
      setImageAlt("");
    } else if (activeTab === "HTML") {
      const htmlImageRegex = new RegExp(
        `<img\\s+src="${escapeRegExp(selectedImage.src)}"\\s+alt="${escapeRegExp(
          selectedImage.alt || ""
        )}"\\s*/>`,
        "g"
      );
      setContent((prev) => {
        const html = markdownToHtml(prev);
        const updatedHtml = html.replace(htmlImageRegex, "");
        const newContent = htmlToMarkdown(updatedHtml);
        setUnsavedChanges(true);
        return newContent;
      });
      setEditImageModalOpen(false);
      setSelectedImage(null);
      setImageAlt("");
    }
  }, [
    selectedImage,
    normalEditor,
    activeTab,
    setContent,
    setEditImageModalOpen,
    setSelectedImage,
    setImageAlt,
    setUnsavedChanges,
    markdownToHtml,
    htmlToMarkdown,
  ]);

  const handleConfirmEditImage = useCallback(() => {
    if (!selectedImage || !imageAlt) {
      message.error("Alt text is required.");
      return;
    }
    if (activeTab === "Normal" && normalEditor) {
      let updated = false;
      normalEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          normalEditor
            .chain()
            .focus()
            .setNodeSelection(pos)
            .setImage({ src: selectedImage.src, alt: imageAlt })
            .run();
          updated = true;
        }
      });
      if (updated) {
        message.success("Image alt text updated.");
        setEditImageModalOpen(false);
        setSelectedImage(null);
        setImageAlt("");
        setUnsavedChanges(true);
      } else {
        message.error("Failed to update image alt text.");
      }
    } else if (activeTab === "Markdown") {
      const markdownImageRegex = new RegExp(
        `!\\[${escapeRegExp(selectedImage.alt || "")}\\]\\(${escapeRegExp(selectedImage.src)}\\)`,
        "g"
      );
      const newMarkdownImage = `![${imageAlt}](${selectedImage.src})`;
      setContent((prev) => {
        const newContent = prev.replace(markdownImageRegex, newMarkdownImage);
        setUnsavedChanges(true);
        return newContent;
      });
      message.success("Image alt text updated.");
      setEditImageModalOpen(false);
      setSelectedImage(null);
      setImageAlt("");
    } else if (activeTab === "HTML") {
      const htmlImageRegex = new RegExp(
        `<img\\s+src="${escapeRegExp(selectedImage.src)}"\\s+alt="${escapeRegExp(
          selectedImage.alt || ""
        )}"\\s*/>`,
        "g"
      );
      const newHtmlImage = `<img src="${selectedImage.src}" alt="${imageAlt}" />`;
      setContent((prev) => {
        const html = markdownToHtml(prev);
        const updatedHtml = html.replace(htmlImageRegex, newHtmlImage);
        const newContent = htmlToMarkdown(updatedHtml);
        setUnsavedChanges(true);
        return newContent;
      });
      message.success("Image alt text updated.");
      setEditImageModalOpen(false);
      setSelectedImage(null);
      setImageAlt("");
    }
  }, [
    selectedImage,
    imageAlt,
    normalEditor,
    activeTab,
    setContent,
    setEditImageModalOpen,
    setSelectedImage,
    setImageAlt,
    setUnsavedChanges,
    markdownToHtml,
    htmlToMarkdown,
  ]);

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const handleAcceptRetry = useCallback(() => {
    if (!retryContent) return;
    if (activeTab === "Normal" && normalEditor) {
      const parsedContent = markdownToHtml(retryContent);
      normalEditor
        .chain()
        .focus()
        .deleteRange({ from: selectionRange.from, to: selectionRange.to })
        .insertContentAt(selectionRange.from, parsedContent)
        .setTextSelection({
          from: selectionRange.from,
          to: selectionRange.from + parsedContent.length,
        })
        .run();
    }
    message.success("Selected lines replaced successfully!");
    setRetryModalOpen(false);
    setRetryContent(null);
    setOriginalContent(null);
    setSelectionRange({ from: 0, to: 0 });
    setUnsavedChanges(true);
  }, [
    retryContent,
    activeTab,
    normalEditor,
    markdownToHtml,
    selectionRange,
    setRetryModalOpen,
    setRetryContent,
    setOriginalContent,
    setSelectionRange,
    setUnsavedChanges,
  ]);

  const handleRejectRetry = useCallback(() => {
    setRetryModalOpen(false);
    setRetryContent(null);
    setOriginalContent(null);
    setSelectionRange({ from: 0, to: 0 });
    message.info("Retry content discarded.");
  }, [setRetryModalOpen, setRetryContent, setOriginalContent, setSelectionRange]);

  const handleAcceptHumanizedContentModified = useCallback(() => {
    if (humanizedContent) {
      setContent(humanizedContent);
      if (normalEditor && !normalEditor.isDestroyed) {
        const htmlContent = markdownToHtml(humanizedContent);
        normalEditor.commands.setContent(htmlContent, false);
      }
      setHtmlContent(markdownToHtml(humanizedContent).replace(/>\s*</g, ">\n<"));
      setUnsavedChanges(true);
      handleAcceptHumanizedContent();
    }
  }, [
    humanizedContent,
    setContent,
    normalEditor,
    markdownToHtml,
    setHtmlContent,
    setUnsavedChanges,
    handleAcceptHumanizedContent,
  ]);

  const handleConfirmTabSwitch = useCallback(() => {
    setUnsavedChanges(false);
    setTabSwitchWarning(null);
  }, [setUnsavedChanges, setTabSwitchWarning]);

  const handleCancelTabSwitch = useCallback(() => {
    setTabSwitchWarning(null);
  }, [setTabSwitchWarning]);

  useEffect(() => {
    if (blog?.images?.length > 0) {
      let updatedContent = safeContent;
      const imagePlaceholders = safeContent.match(/{Image:.*?}/g) || [];
      imagePlaceholders.forEach((placeholder, index) => {
        const imageData = blog.images[index];
        if (imageData?.url) {
          updatedContent = updatedContent.replace(
            placeholder,
            `![${imageData.alt || "Image"}](${imageData.url})`
          );
        }
      });
      setContent(updatedContent);
    }
  }, [blog, safeContent, setContent]);

  useEffect(() => {
    if (activeTab === "Normal" && normalEditor && normalEditor?.view?.dom) {
      const editorElement = normalEditor.view.dom;
      editorElement.addEventListener("click", handleImageClick);
      return () => {
        if (editorElement) {
          editorElement.removeEventListener("click", handleImageClick);
        }
      };
    }
  }, [normalEditor, activeTab, handleImageClick]);

  useEffect(() => {
    if (activeTab === "HTML" && !markdownPreview) {
      requestAnimationFrame(() => Prism.highlightAll());
    }
  }, [safeContent, activeTab, markdownPreview]);

  useEffect(() => {
    const editorDom = normalEditor?.view?.dom;
    if (!editorDom) return;

    const handleMouseOver = async (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      const url = link.href;
      const rect = link.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      const pos = {
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      };

      setLinkPreviewPos(pos);
      setLinkPreviewUrl(url);
      setLinkPreviewElement(link);

      try {
        const data = await getLinkPreview(url);
        setLinkPreview(data || { title: url, description: "" });
      } catch (err) {
        console.error("Failed to fetch link preview:", err);
        setLinkPreview({ title: url, description: "" });
      }
    };

    const handleMouseOut = (e) => {
      if (e.target.closest("a")) {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => {
          setLinkPreview(null);
          setLinkPreviewPos(null);
          setLinkPreviewUrl(null);
          setLinkPreviewElement(null);
        }, 200);
      }
    };

    editorDom.addEventListener("mouseover", handleMouseOver, true);
    editorDom.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      editorDom.removeEventListener("mouseover", handleMouseOver, true);
      editorDom.removeEventListener("mouseout", handleMouseOut, true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [activeTab, normalEditor]);

  const handleRemoveLink = useCallback(() => {
    if (!linkPreviewElement || !normalEditor) return;

    const pos = normalEditor.view.posAtDOM(linkPreviewElement, 0);
    const end = pos + (linkPreviewElement.textContent?.length || 0);
    normalEditor.chain().focus().setTextSelection({ from: pos, to: end }).unsetLink().run();

    setLinkPreview(null);
    setLinkPreviewPos(null);
    setLinkPreviewUrl(null);
    setLinkPreviewElement(null);
  }, [linkPreviewElement, normalEditor]);

  const renderContentArea = () => {
    if (isEditorLoading || !editorReady || blog?.status === "pending") {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
          <Loading />
        </div>
      );
    }

    if (activeTab === "Normal") {
      if (humanizedContent && showDiff) {
        if (!editorContent && !humanizedContent) {
          return (
            <div className="p-4 bg-white h-screen overflow-auto">
              <p className="text-gray-500">No content to compare.</p>
            </div>
          );
        }

        return (
          <Suspense fallback={<Loading />}>
            <ContentDiffViewer
              oldMarkdown={editorContent}
              newMarkdown={humanizedContent}
              onAccept={handleAcceptHumanizedContentModified}
              onReject={handleAcceptOriginalContent}
            />
          </Suspense>
        );
      } else {
        return (
          <div className="h-[500px] md:h-screen overflow-auto custom-scroll">
            {normalEditor && (
              <BubbleMenu
                editor={normalEditor}
                className="flex gap-2 bg-white shadow-lg p-2 rounded-lg border border-gray-200"
              >
                <Tooltip title="Bold" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => normalEditor.chain().focus().toggleBold().run()}
                  >
                    <Bold className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Italic" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => normalEditor.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Heading" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => normalEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Link" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={handleConfirmLink}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Image" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={handleConfirmImage}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Rewrite" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => handleReplace()}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </Tooltip>
              </BubbleMenu>
            )}
            <EditorContent editor={normalEditor} />
            {activeSpan instanceof HTMLElement && (
              <div
                className="proof-ui-bubble"
                ref={bubbleRef}
                style={{
                  position: "absolute",
                  top: activeSpan.getBoundingClientRect().top + window.scrollY - bubbleRef.current?.offsetHeight - 8,
                  left: activeSpan.getBoundingClientRect().left + window.scrollX,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  Replace with: <strong>{activeSpan.dataset.suggestion}</strong>
                </div>
                <button onClick={applyChange}>✅ Accept</button>
                <button onClick={rejectChange} style={{ marginLeft: 6 }}>
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        );
      }
    }

    if (markdownPreview && (activeTab === "Markdown" || activeTab === "HTML")) {
      if (activeTab === "HTML" && htmlContent.trim().startsWith("<!DOCTYPE html>") || htmlContent.trim().startsWith("<html")) {
        const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ["style"],
          ADD_ATTR: ["target"],
        });
        return (
          <div
            className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 ${selectedFont}`}
          >
            <iframe srcDoc={sanitizedHtml} title="HTML Preview" sandbox="allow-same-origin" />
          </div>
        );
      }

      return (
        <div
          className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 bg-white ${selectedFont}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a: ({ href, children }) => (
                <Tooltip title={href} placement="top">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {children}
                  </a>
                </Tooltip>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg mx-auto my-3 w-3/4 h-auto shadow-sm"
                />
              ),
              h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium">{children}</h3>,
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-700">
                  {React.Children.map(children, (child, index) => {
                    if (typeof child === "string") {
                      let remainingText = child;
                      let elements = [];
                      let keyIndex = 0;
                      const sortedSuggestions = [...proofreadingResults].sort(
                        (a, b) => b.original.length - a.original.length
                      );
                      while (remainingText.length > 0) {
                        let matched = false;
                        for (const suggestion of sortedSuggestions) {
                          const regex = new RegExp(
                            suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                            "i"
                          );
                          const match = remainingText.match(regex);
                          if (match && match.index === 0) {
                            elements.push(
                              <span
                                key={`${index}-${keyIndex++}`}
                                className="suggestion-highlight"
                                onMouseEnter={() => setHoveredSuggestion(suggestion)}
                                onMouseLeave={() => setHoveredSuggestion(null)}
                              >
                                {match[0]}
                                {hoveredSuggestion === suggestion && (
                                  <div
                                    className="suggestion-tooltip"
                                    style={{ top: "100%", left: 0 }}
                                  >
                                    <p className="text-sm mb-2">
                                      <strong>Suggested:</strong> {suggestion.change}
                                    </p>
                                    <button
                                      className="bg-blue-600 text-white px-2 py-1 rounded"
                                      onClick={() =>
                                        handleReplace(suggestion.original, suggestion.change)
                                      }
                                    >
                                      Replace
                                    </button>
                                  </div>
                                )}
                              </span>
                            );
                            remainingText = remainingText.slice(match[0].length);
                            matched = true;
                            break;
                          }
                        }
                        if (!matched) {
                          let minIndex = remainingText.length;
                          let nextMatch = null;
                          for (const suggestion of sortedSuggestions) {
                            const regex = new RegExp(
                              suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                              "i"
                            );
                            const match = remainingText.match(regex);
                            if (match && match.index < minIndex) {
                              minIndex = match.index;
                              nextMatch = match;
                            }
                          }
                          if (minIndex === remainingText.length) {
                            elements.push(
                              <span key={`${index}-${keyIndex++}`}>{remainingText}</span>
                            );
                            remainingText = "";
                          } else {
                            elements.push(
                              <span key={`${index}-${keyIndex++}`}>
                                {remainingText.slice(0, minIndex)}
                              </span>
                            );
                            remainingText = remainingText.slice(minIndex);
                          }
                        }
                      }
                      return elements;
                    }
                    return child;
                  })}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <pre className="bg-gray-800 text-white p-4 rounded-lg">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 text-red-600 px-1 rounded" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {safeContent}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-lg rounded-t-none shadow-sm h-[10vh] sm:h-[70vh] md:h-[80vh]">
        {activeTab === "Markdown" && (
          <MarkdownEditor
            content={safeContent}
            onChange={(newContent) => {
              setContent(newContent);
              setUnsavedChanges(true);
            }}
            className="h-full"
          />
        )}
        {activeTab === "HTML" && (
          <HtmlEditor
            content={htmlContent}
            onChange={(newHtml) => {
              setHtmlContent(newHtml);
              setContent(htmlToMarkdown(newHtml));
              setUnsavedChanges(true);
            }}
            className="h-full"
          />
        )}
      </div>
    );
  };

  return (
    <>
      {renderContentArea()}
      {linkPreviewPos &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: linkPreviewPos.top,
              left: linkPreviewPos.left,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              maxWidth: "300px",
              minWidth: "200px",
              display: "block",
            }}
            onMouseEnter={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current);
            }}
            onMouseLeave={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current);
              hideTimeout.current = setTimeout(() => {
                setLinkPreview(null);
                setLinkPreviewPos(null);
                setLinkPreviewUrl(null);
                setLinkPreviewElement(null);
              }, 200);
            }}
          >
            {linkPreview ? (
              <>
                <h4 className="text-sm font-semibold truncate">
                  {linkPreview.title || "No title"}
                </h4>
                <p className="text-xs text-gray-600 truncate">{linkPreview.description}</p>
                {linkPreview.images && linkPreview.images[0] && (
                  <img
                    src={linkPreview.images[0]}
                    alt="preview"
                    style={{ width: "100%", height: "auto", marginTop: "8px", borderRadius: "4px" }}
                  />
                )}
                <Button
                  onClick={handleRemoveLink}
                  size="small"
                  danger
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    display: "block",
                  }}
                >
                  Remove Link
                </Button>
              </>
            ) : (
              <p className="text-xs">Loading preview...</p>
            )}
          </div>,
          document.body
        )}
      <Modal
        title="Insert Link"
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLinkModalOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button type="primary" onClick={handleConfirmLink} className="rounded-lg">
              Insert Link
            </Button>
          </div>
        }
        centered
      >
        <Input
          bordered={false}
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full mt-4 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
      </Modal>
      <Modal
        title="Edit Image Alt Text"
        open={editImageModalOpen}
        onOk={handleConfirmEditImage}
        onCancel={() => {
          setEditImageModalOpen(false);
          setSelectedImage(null);
          setImageAlt("");
        }}
        okText="Update Alt Text"
        cancelText="Cancel"
        footer={[
          <div className="flex justify-end gap-2">
            <Button
              key="delete"
              onClick={handleDeleteImage}
              danger
              icon={<Trash2 className="w-4 h-4" />}
              className="rounded-lg"
            >
              Delete Image
            </Button>
            <Button
              key="cancel"
              onClick={() => {
                setEditImageModalOpen(false);
                setSelectedImage(null);
                setImageAlt("");
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button key="ok" type="primary" onClick={handleConfirmEditImage} className="rounded-lg">
              Update Alt Text
            </Button>
          </div>,
        ]}
        centered
      >
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
        />
        <p className="mt-2 text-xs text-gray-500">Provide alt text for accessibility</p>
        {selectedImage && (
          <div className="mt-4">
            <img
              src={selectedImage.src}
              alt={imageAlt || selectedImage.alt}
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
      </Modal>
      <Modal
        title="Insert Image"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setImageModalOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button type="primary" onClick={handleConfirmImage} className="rounded-lg">
              Insert Image
            </Button>
          </div>
        }
        centered
      >
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full mt-4"
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
        />
        <p className="mt-2 text-xs text-gray-500">Provide alt text for accessibility</p>
      </Modal>
      {retryModalOpen && (
        <Modal
          title="Generated Content"
          open={retryModalOpen}
          onCancel={handleRejectRetry}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleRejectRetry}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reject
              </Button>
              <Button
                onClick={handleAcceptRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Accept
              </Button>
            </div>
          }
          centered
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Original Text</h4>
              <div className="p-4 bg-gray-100 rounded-md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="prose"
                  components={{
                    a: ({ href, children }) => (
                      <Tooltip title={href} placement="top">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
                      </Tooltip>
                    ),
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  }}
                >
                  {originalContent || "No text selected"}
                </ReactMarkdown>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Improved Text</h4>
              <div className="p-4 bg-gray-50 rounded-md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="prose"
                  components={{
                    a: ({ href, children }) => (
                      <Tooltip title={href} placement="top">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
                      </Tooltip>
                    ),
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  }}
                >
                  {retryContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {tabSwitchWarning && (
        <Modal
          title="Unsaved Changes"
          open={true}
          onCancel={handleCancelTabSwitch}
          centered
          className="rounded-lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCancelTabSwitch}
                className="rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleConfirmTabSwitch}
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Continue without Saving
              </Button>
            </div>
          }
        >
          <p className="text-gray-700">
            You have unsaved changes. Switching tabs may cause you to lose your work. Are you sure
            you want to continue?
          </p>
        </Modal>
      )}
    </>
  );
};

export default EditorContentArea;
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  MessageSquare,
  RefreshCcw,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import axiosInstance from "@/api"
import { asApiError } from "@/types/api"
import useAiReviewStore from "@/store/useAiReviewStore"
import useEditorStore from "@store/useEditorStore"
import TurndownService from "turndown"

interface SectionToolsPanelProps {
  blog: any
  isLocked?: boolean
  isPublicMode?: boolean
  setIsSidebarOpen?: (open: boolean) => void
}

const SECTION_TASK_LABELS: Record<string, string> = {
  rewrite: "Rewrite",
  proofread: "Proofread",
  promptChanges: "Custom Prompt",
}

/**
 * Reduces whatever the section endpoint returns to the *inside* of a section.
 *
 * That endpoint answers in whole-section markup — the same shape it reports back
 * as `previousContent`. Writing it into the section being edited would nest a
 * second <section> carrying the same id, and because turndown is told to keep
 * <section>, the duplicate survives into the saved blog. Section Tools then lists
 * it twice, both cards select together, and both resolve to the same element,
 * since getElementById can only ever return the first match.
 *
 * Sections are unwrapped innermost-first so unwrapping an outer one cannot
 * re-introduce a nested one.
 */
const unwrapSectionMarkup = (html: string | null | undefined, parser: DOMParser) => {
  if (!html || !/<section[\s>]/i.test(html)) return html || ""

  const doc = parser.parseFromString(html, "text/html")
  for (const section of Array.from(doc.body.querySelectorAll("section")).reverse()) {
    const inner = section.querySelector(".section-content") || section
    section.replaceWith(...Array.from(inner.childNodes))
  }
  return doc.body.innerHTML
}

/**
 * AI Section Tools panel — targeted rewrite/proofread/custom-prompt on one section
 * of the blog. `availableSections` is computed by TextEditorSidebar (it also drives
 * whether this nav item shows at all) and lives in `useEditorStore`; everything else
 * here (which section is selected, the task, in-flight state) is panel-local.
 */
const SectionToolsPanel: React.FC<SectionToolsPanelProps> = ({
  blog,
  isLocked,
  isPublicMode,
  setIsSidebarOpen,
}) => {
  const editorContent = useEditorStore((s) => s.editorContent)
  const setEditorContent = useEditorStore((s) => s.setEditorContent)
  const availableSections = useEditorStore((s) => s.availableSections)
  const openReview = useAiReviewStore((s) => s.openReview)

  const [sectionToolState, setSectionToolState] = useState({
    sectionId: "",
    task: "rewrite",
    instructions: "",
  })
  const [isProcessingSection, setIsProcessingSection] = useState(false)

  // Clear any highlight left in the editor when this panel goes away (tab switch).
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("highlight-section", { detail: null }))
    }
  }, [])

  const handleSectionTask = async () => {
    if (blog?.isArchived) {
      toast.error("This blog is archived. Please restore it to perform this action.")
      return
    }
    if (!blog?._id) return toast.error("Blog ID missing")
    if (!sectionToolState.sectionId) return toast.error("Please select a section")
    if (sectionToolState.task === "promptChanges" && !sectionToolState.instructions.trim()) {
      return toast.error("Please enter instructions for custom task")
    }

    setIsProcessingSection(true)
    try {
      const payload = {
        sectionId: sectionToolState.sectionId,
        task: sectionToolState.task,
        userInstructions: sectionToolState.instructions,
      }

      // API Call
      const response = await axiosInstance.post(`/blogs/${blog._id}/sectionTask`, payload)

      if (response.data && (response.data.content || response.data.markdown)) {
        let newFullContent = editorContent
        let _originalSectionContent = ""
        let newSectionContent = response.data.markdown || response.data.content || ""

        // Helper to normalize slugs similar to how TipTap/Marked does
        const getSlug = (text: any) =>
          text
            .toLowerCase()
            .replace(/[^\w]+/g, "-")
            .replace(/^-+|-+$/g, "")

        const turndownService = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" })
        turndownService.keep([
          "p",
          "div",
          "iframe",
          "table",
          "tr",
          "th",
          "td",
          "figure",
          "figcaption",
          "section",
          "article",
        ])

        // STRATEGY 1: DOMParser (HTML Content)
        // Only works if editorContent contains actual HTML tags with IDs
        const parser = new DOMParser()
        const doc = parser.parseFromString(editorContent || "", "text/html")
        const sectionEl = doc.getElementById(sectionToolState.sectionId)

        if (sectionEl) {
          // Found explicit HTML section
          _originalSectionContent = turndownService.turndown(sectionEl.outerHTML)

          // Special handling for the Meta/Overview section to preserve structure
          if (sectionToolState.sectionId === "blog-meta") {
            const titleEl = sectionEl.querySelector(".blog-title")
            const descEl = sectionEl.querySelector(".blog-description")

            // Try to split response content into title and description if it contains both
            // Usually AI returns description, but sometimes it includes the title
            if (response.data.content) {
              const resDoc = parser.parseFromString(response.data.content, "text/html")
              const resTitle = resDoc.querySelector("h1, h2, h3")
              const resParas = Array.from(resDoc.querySelectorAll("p"))

              if (resTitle && titleEl) {
                titleEl.textContent = resTitle.textContent
              }
              if (resParas.length > 0 && descEl) {
                descEl.innerHTML = resParas[0].innerHTML
              } else if (descEl) {
                descEl.innerHTML = response.data.content
              }
            }
          } else {
            // Never write the response in raw: it arrives as whole-section markup,
            // which would nest a duplicate id inside the section being edited.
            // Replacing the whole wrapper also repairs a section already carrying
            // one from before this was guarded.
            const incoming = unwrapSectionMarkup(response.data.content, parser)

            const contentDiv = sectionEl.querySelector(".section-content")
            if (contentDiv) {
              contentDiv.innerHTML = incoming
            } else {
              // If .section-content wrapper is missing, preserve headers and wrap/replace content
              const headings = Array.from(sectionEl.querySelectorAll("h1, h2, h3, h4, h5, h6"))
              const headerHTML = headings.map((h) => h.outerHTML).join("")

              // Only prepend headers if they aren't already in the AI response —
              // which may state them as markdown rather than as <h1>-<h6>.
              const hasHeaderInResponse =
                /<h[1-6]/i.test(incoming) || /^\s{0,3}#{1,6}\s/m.test(incoming)
              sectionEl.innerHTML = (hasHeaderInResponse ? "" : headerHTML) + incoming
            }
          }

          // Convert modified HTML back to Markdown to match editor format
          const modifiedHtml = doc.body.innerHTML
          newFullContent = turndownService.turndown(modifiedHtml)

          // If we got HTML back, clean it up for comparison too
          if (response.data.content && !response.data.markdown) {
            newSectionContent = turndownService.turndown(response.data.content)
          }
        } else {
          // STRATEGY 2: Markdown Content (Fallback)
          // Parse markdown line-by-line to find the header matching the sectionId
          // Then replace content until next header
          const lines = (editorContent || "").split("\n")
          let startLine = -1
          let endLine = -1
          let _foundHeaderLevel = 0

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            // Match Headers: # Title, ## Title, etc.
            const match = line.match(/^(#{1,6})\s+(.*)$/)
            if (match) {
              const level = match[1].length
              const text = match[2].trim()
              const slug = getSlug(text)

              if (slug === sectionToolState.sectionId) {
                // Found our start header
                startLine = i
                _foundHeaderLevel = level
              } else if (startLine !== -1) {
                // We are inside the section, and found another header
                // If this header is same level or higher (smaller number), our section ends here.
                // Actually, strictly speaking, any header ends the previous section block in simple markdown structure
                endLine = i
                break
              }
            }
          }

          if (startLine !== -1) {
            // Found the section
            if (endLine === -1) endLine = lines.length

            _originalSectionContent = lines.slice(startLine, endLine).join("\n")

            // Construct new content:
            // 1. Everything before the header (lines 0 to startLine-1)
            // 2. The Header itself (lines[startLine]) - we keep the header!
            // 3. The NEW Content (from API markdown or content)
            // 4. Everything after (lines[endLine] to end)

            const before = lines.slice(0, startLine + 1).join("\n") // Include header line
            const after = lines.slice(endLine).join("\n")

            newFullContent = `${before}\n\n${newSectionContent}\n\n${after}`

            // For the diff display, let's include the header in the 'new' version too if possible
            // or just keep it consistent with originalSectionContent
            newSectionContent = `${lines[startLine]}\n\n${newSectionContent}`
          } else {
            toast.error(
              "Could not locate section in current content. Ensure section headers are not modified."
            )
            setIsProcessingSection(false)
            return
          }
        }

        let htmlContent = response.data.previousContent
        const doc1 = parser.parseFromString(htmlContent, "text/html")
        const oldContentDiv = doc1.querySelector(".section-content")
        htmlContent = oldContentDiv ? oldContentDiv.innerHTML : htmlContent

        // Hand the rewrite to the editor for review instead of replacing
        // outright. Everything the commit needs is captured here, since the
        // review outlives this call.
        const taskLabel = SECTION_TASK_LABELS[sectionToolState.task] || "Refinement"
        openReview({
          title: "Review Section Changes",
          task: `Task: ${taskLabel}`,
          original: htmlContent,
          refined: response.data.content,
          acceptLabel: "Accept & Apply to Section",
          rejectLabel: "Keep Original",
          onAccept: () => {
            setEditorContent(newFullContent)
            toast.success("Changes applied successfully!")
          },
        })
        setIsSidebarOpen?.(false)

        // Clear instructions if custom
        if (sectionToolState.task === "promptChanges") {
          setSectionToolState((prev) => ({ ...prev, instructions: "" }))
        }
      } else {
        toast.warning("No content returned from AI")
      }
    } catch (rawError) {
      const error = asApiError(rawError)
      console.error("Section task failed:", error)
      toast.error(error.response?.data?.message || "Failed to process section task")
    } finally {
      setIsProcessingSection(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 line-clamp-1">Section Tools</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                AI Modification
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {/* Section List (Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
              Result Sections ({availableSections.length})
            </span>
            {sectionToolState.sectionId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSectionToolState((prev) => ({ ...prev, sectionId: "" }))
                  window.dispatchEvent(new CustomEvent("highlight-section", { detail: null }))
                }}
                className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            ) : (
              <span className="text-[10px] text-gray-400">Select to edit</span>
            )}
          </div>

          <div className="grid gap-3">
            {availableSections.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-400 text-xs">
                No headers found. Add headings to your content to use section tools.
              </div>
            ) : (
              availableSections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  aria-pressed={sectionToolState.sectionId === section.id}
                  onClick={() => {
                    if (blog?.isArchived) {
                      toast.error(
                        "This blog is archived. Please restore it to perform this action."
                      )
                      return
                    }
                    setSectionToolState((prev) => ({ ...prev, sectionId: section.id }))
                    // Dispatch highlight event
                    window.dispatchEvent(
                      new CustomEvent("highlight-section", { detail: section.id })
                    )
                  }}
                  className={`
                            group relative block w-full p-3 rounded-xl border cursor-pointer transition-all duration-200 text-left
                            ${
                              sectionToolState.sectionId === section.id
                                ? "bg-primary/10 border-primary/40 shadow-none ring-1 ring-primary/20"
                                : blog?.isArchived
                                  ? "bg-gray-50 border-gray-100 cursor-not-allowed"
                                  : "bg-white border-gray-200 hover:border-primary/30 hover:shadow-none"
                            }
                        `}
                >
                  {/* spans, not h4/p — <button> admits only phrasing content */}
                  <span
                    className={`block text-sm font-bold mb-1 line-clamp-1 ${sectionToolState.sectionId === section.id ? "text-blue-800" : "text-gray-800"}`}
                  >
                    {section.title}
                  </span>
                  <span
                    className={`block text-[11px] line-clamp-2 leading-relaxed ${sectionToolState.sectionId === section.id ? "text-blue-600/80" : "text-gray-500"}`}
                  >
                    {section.preview || "No content preview available..."}
                  </span>

                  {sectionToolState.sectionId === section.id && (
                    <span className="absolute top-3 right-3">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Task Selector */}
        <div
          className={`space-y-3 transition-opacity duration-300 ${!sectionToolState.sectionId ? "opacity-50 pointer-events-none grayscale" : "opacity-100"}`}
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
            Operation
          </span>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: "rewrite",
                label: "Rewrite Content",
                icon: RefreshCcw,
                desc: "Improve clarity and flow",
              },
              {
                id: "proofread",
                label: "Proofread",
                icon: CheckCircle,
                desc: "Fix grammar and spelling",
              },
              {
                id: "promptChanges",
                label: "Custom Prompt",
                icon: MessageSquare,
                desc: "Give your own instructions",
              },
            ].map((task) => (
              <button
                type="button"
                key={task.id}
                aria-pressed={sectionToolState.task === task.id}
                onClick={() => setSectionToolState((prev) => ({ ...prev, task: task.id }))}
                className={`
                            relative w-full text-left p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200
                            ${
                              sectionToolState.task === task.id
                                ? "bg-blue-50 border-blue-200 shadow-sm"
                                : "bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                            }
                        `}
              >
                <span
                  className={`
                            p-2 rounded-full
                            ${sectionToolState.task === task.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}
                        `}
                >
                  <task.icon className="w-4 h-4" />
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${sectionToolState.task === task.id ? "text-blue-900" : ""}`}
                  >
                    {task.label}
                  </span>
                  <span className="block text-[10px] text-gray-400">{task.desc}</span>
                </span>
                {sectionToolState.task === task.id && (
                  <span className="absolute top-3 right-3 text-blue-500">
                    <CheckCircle className="w-4 h-4 fill-blue-100" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        {sectionToolState.task === "promptChanges" && sectionToolState.sectionId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <label
              htmlFor="section-tool-instructions"
              className="text-xs font-bold text-gray-500 uppercase tracking-widest block"
            >
              Your Instructions
            </label>
            <textarea
              id="section-tool-instructions"
              placeholder="E.g., Make it more professional and add 2 examples..."
              rows={4}
              value={sectionToolState.instructions}
              onChange={(e) =>
                setSectionToolState((prev) => ({ ...prev, instructions: e.target.value }))
              }
              className="textarea textarea-bordered w-full text-sm bg-gray-50 focus:bg-white"
            />
          </motion.div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSectionTask}
            disabled={
              isProcessingSection ||
              blog?.isArchived ||
              isLocked ||
              !sectionToolState.sectionId ||
              (sectionToolState.task === "custom" && !sectionToolState.instructions.trim())
            }
            className={`btn btn-primary w-full shadow-lg transition-all border-none rounded-xl ${
              blog?.isArchived || isPublicMode
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "hover:shadow-xl hover:scale-[1.02] bg-linear-to-r from-indigo-600 to-blue-600"
            } ${isProcessingSection ? "opacity-100! text-white" : ""}`}
          >
            {isProcessingSection ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isPublicMode
              ? "AI Tools Locked"
              : isProcessingSection
                ? "Processing..."
                : "Run AI Task"}
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            This will update {sectionToolState.sectionId ? "the selected section" : "a section"}{" "}
            directly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SectionToolsPanel

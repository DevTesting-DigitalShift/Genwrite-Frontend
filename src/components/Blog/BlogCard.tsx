import React from "react"
import {
  Sparkles,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trash2,
  ArchiveRestore,
  MousePointerClick,
  Eye,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import dayjs from "dayjs"

// Human-readable labels for each pipeline step
const TASK_LABELS: Record<string, string> = {
  "keyword-research": "Keyword Research",
  outsource: "Content Research",
  context: "Context Analysis",
  outline: "Outline Generation",
  content: "AI Content Generation",
  "images-alt_texts": "Image Alt Texts",
  "seo-metadata": "SEO Metadata",
  "slug-generation": "Slug Generation",
  "final-merge": "Final Assembly",
  "wordpress-post": "Blog Posting",
}

// Tasks whose failure is non-critical (blog content is still usable)
const NON_CRITICAL_TASKS = new Set(["images-alt_texts", "wordpress-post"])

interface TaskStatus {
  [key: string]: string | undefined
}

interface Blog {
  _id: string
  title: string
  status: "complete" | "pending" | "failed" | "in-progress"
  createdAt: string
  updatedAt: string
  shortContent: string
  focusKeywords: string[]
  aiModel: string
  aiModelVer?: string
  agendaNextRun?: string
  isManuallyEdited?: boolean
  isArchived: boolean
  archiveDate: string
  gscClicks: number
  gscImpressions: number
  taskStatus?: TaskStatus
}

interface BlogCardProps {
  blog: Blog
  onBlogClick: (blog: Blog) => void
  onManualBlogClick: (blog: Blog) => void
  onRetry: (id: string) => void
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
  handlePopup: (config: Record<string, any>) => void
  hasGSCPermissions?: boolean
  isTrashcan?: boolean
}

// ---------- helpers ----------

function getFailedTasks(taskStatus?: TaskStatus): string[] {
  if (!taskStatus) return []
  return Object.entries(taskStatus)
    .filter(([k, v]) => k !== "error" && v === "failed")
    .map(([k]) => k)
}

function getCurrentTask(taskStatus?: TaskStatus): string | null {
  if (!taskStatus) return null
  const entry = Object.entries(taskStatus).find(
    ([k, v]) => k !== "error" && (v === "pending" || v === "in-progress")
  )
  return entry ? entry[0] : null
}

// Is the failure only caused by non-critical steps? (posting / image alt)
function isPartialFailure(blogStatus: string, failedTasks: string[]): boolean {
  return (
    blogStatus === "failed" &&
    failedTasks.length > 0 &&
    failedTasks.every(t => NON_CRITICAL_TASKS.has(t))
  )
}

// ---------- Tooltip ----------

const TaskTooltip = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-150 pointer-events-none">
    <div className="bg-slate-900 text-white rounded-xl p-3 shadow-2xl text-[11px] min-w-[180px] max-w-[220px]">
      {children}
      {/* caret */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
    </div>
  </div>
)

// ---------- StatusBadge ----------

const StatusBadge = ({ status, taskStatus }: { status: string; taskStatus?: TaskStatus }) => {
  const failedTasks = getFailedTasks(taskStatus)
  const currentTask = getCurrentTask(taskStatus)
  const isRunning = status === "pending" || status === "in-progress"
  const partialFail = isPartialFailure(status, failedTasks)

  // --- PENDING / IN-PROGRESS ---
  if (isRunning) {
    const hasFailedSteps = failedTasks.length > 0

    return (
      <div className="relative group/badge cursor-default">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider select-none
            ${
              hasFailedSteps
                ? "bg-orange-50 border-orange-200/70 text-orange-600"
                : "bg-amber-50 border-amber-200/60 text-amber-600"
            }`}
        >
          <Loader2 size={12} className="animate-spin" />
          <span>Pending</span>
          {hasFailedSteps && <AlertTriangle size={10} className="text-rose-500 ml-0.5" />}
        </div>

        {/* Tooltip: show current step + any failed sub-steps */}
        {(hasFailedSteps || currentTask) && (
          <TaskTooltip>
            {hasFailedSteps && (
              <>
                <p className="text-rose-400 font-bold mb-1.5">Failed steps — retrying:</p>
                {failedTasks.map(t => (
                  <p key={t} className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-px" />
                    {TASK_LABELS[t] ?? t}
                  </p>
                ))}
                {currentTask && (
                  <>
                    <div className="my-2 border-t border-slate-700" />
                    <p className="text-amber-400 font-bold mb-1">Now running:</p>
                    <p className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-px animate-pulse" />
                      {TASK_LABELS[currentTask] ?? currentTask}
                    </p>
                  </>
                )}
              </>
            )}
            {!hasFailedSteps && currentTask && (
              <>
                <p className="text-amber-400 font-bold mb-1.5">Currently running:</p>
                <p className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-px animate-pulse" />
                  {TASK_LABELS[currentTask] ?? currentTask}
                </p>
              </>
            )}
          </TaskTooltip>
        )}
      </div>
    )
  }

  // --- FAILED ---
  if (status === "failed") {
    return (
      <div className="relative group/badge cursor-default">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider select-none
            ${
              partialFail
                ? "bg-orange-50 border-orange-200/70 text-orange-600"
                : "bg-rose-50 border-rose-200/60 text-rose-600"
            }`}
        >
          <AlertCircle size={12} />
          <span>{partialFail ? "Partial" : "Failed"}</span>
        </div>

        {/* Tooltip: which tasks failed */}
        {failedTasks.length > 0 && (
          <TaskTooltip>
            <p className={`font-bold mb-1.5 ${partialFail ? "text-orange-400" : "text-rose-400"}`}>
              {partialFail ? "Non-critical steps failed:" : "Failed steps:"}
            </p>
            {failedTasks.map(t => (
              <p key={t} className="text-slate-300 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 mt-px ${
                    partialFail ? "bg-orange-400" : "bg-rose-400"
                  }`}
                />
                {TASK_LABELS[t] ?? t}
              </p>
            ))}
            {partialFail && (
              <p className="mt-2 text-slate-400 text-[10px] italic">Content is still usable ↑</p>
            )}
          </TaskTooltip>
        )}
      </div>
    )
  }

  // --- COMPLETE ---
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600">
      <CheckCircle2 size={12} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Complete</span>
    </div>
  )
}

// ---------- BlogCard ----------

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  onBlogClick,
  onManualBlogClick,
  onRetry,
  onArchive,
  onRestore,
  handlePopup,
  hasGSCPermissions = false,
  isTrashcan = false,
}) => {
  const stripMarkdown = (text: string) =>
    text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()

  const isManualEditor = blog.isManuallyEdited === true
  const isRunning = blog.status === "pending" || blog.status === "in-progress"
  const isGemini = /gemini/gi.test(blog.aiModel)
  const isChatGPT = /gpt|openai/gi.test(blog.aiModel)
  const isClaude = /claude/gi.test(blog.aiModel)
  const { focusKeywords, taskStatus } = blog

  // Derive task-level state
  const failedTasks = getFailedTasks(taskStatus)
  const partial = isPartialFailure(blog.status, failedTasks)

  // Pending blogs: show scheduled time
  const scheduledTime =
    isRunning && blog.agendaNextRun ? dayjs(blog.agendaNextRun).format("MMM D, h:mm A") : null

  // Border color — partial failure gets amber instead of rose
  const borderClass = isManualEditor
    ? "border-slate-400"
    : blog.status === "failed"
      ? partial
        ? "border-orange-400"
        : "border-rose-500"
      : blog.status === "complete"
        ? "border-emerald-500"
        : "border-amber-500"

  const displayModel = blog.aiModelVer
    ? blog.aiModelVer.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : isGemini
      ? "Gemini 2.0 Flash"
      : blog.aiModel || "AI Generated"

  // Retry — keep confirmation popup
  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const retryReason =
      failedTasks.length > 0
        ? ` (Failed: ${failedTasks.map(t => TASK_LABELS[t] ?? t).join(", ")})`
        : ""
    handlePopup({
      title: "Regenerate Blog",
      description: (
        <span className="my-2">
          Are you sure you want to retry generating <b>{blog.title}</b>?{retryReason}
        </span>
      ),
      confirmText: "Yes, Retry",
      onConfirm: () => onRetry(blog._id),
      confirmProps: {
        type: "text",
        className: "border-emerald-500! bg-emerald-100! px-4 text-sm rounded-sm text-emerald-600!",
      },
    })
  }

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onArchive?.(blog._id)
  }

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRestore?.(blog._id)
  }

  const handleCardClick = () => {
    if (!isRunning) {
      if (isManualEditor) {
        onManualBlogClick(blog)
      } else {
        onBlogClick(blog)
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className={`group flex flex-col bg-white rounded-xl border-2 ${borderClass} p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer min-h-[360px] h-full relative overflow-hidden`}
        onClick={handleCardClick}
      >
        {/* Header: Model + Action Buttons */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110 overflow-hidden">
              {isGemini ? (
                <img src="/Images/gemini.webp" alt="Gemini" className="w-6 h-6 object-contain" />
              ) : isChatGPT ? (
                <img src="/Images/chatgpt.webp" alt="ChatGPT" className="w-6 h-6 object-contain" />
              ) : isClaude ? (
                <img src="/Images/claude.webp" alt="Claude" className="w-6 h-6 object-contain" />
              ) : (
                <Sparkles size={18} className="text-indigo-500" />
              )}
            </div>
            <span className="text-sm font-black text-slate-700 leading-none">{displayModel}</span>
          </div>

          {/* Direct action buttons */}
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {blog.status === "failed" && !isTrashcan && (
              <button
                onClick={handleRetryClick}
                title="Retry generation"
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
              >
                <RotateCcw size={16} />
              </button>
            )}
            {!isTrashcan && onArchive && (
              <button
                onClick={handleArchiveClick}
                title="Move to trash"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
              >
                <Trash2 size={16} />
              </button>
            )}
            {isTrashcan && onRestore && (
              <button
                onClick={handleRestoreClick}
                title="Restore blog"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
              >
                <ArchiveRestore size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="min-w-0 mb-6 flex-1">
          <h3 className="text-[17px] font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
            {blog.title || "Untitled Article"}
          </h3>
          <p className="text-[13px] mt-4 text-slate-500 leading-relaxed line-clamp-3 font-medium">
            {stripMarkdown(blog.shortContent) ||
              (isRunning
                ? "Your AI agent is crafting this article with deep research..."
                : "No excerpt available for this article.")}
          </p>
        </div>

        {/* Tags & Footer */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {focusKeywords?.slice(0, 5).map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60 uppercase tracking-tight"
                >
                  {tag}
                </span>
              ))}
              {focusKeywords?.length > 5 && (
                <span className="text-xs font-bold text-slate-400 flex items-center">
                  +{focusKeywords.length - 5}
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {/* Date + Status row */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                <Calendar size={12} strokeWidth={2.5} />
                {new Date(blog.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <StatusBadge status={blog.status} taskStatus={taskStatus} />
            </div>

            {/* Scheduled time for pending */}
            {scheduledTime && (
              <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold">
                <Clock size={11} strokeWidth={2.5} />
                <span>Scheduled: {scheduledTime}</span>
              </div>
            )}

            {/* Partial failure hint (non-critical steps failed, content still usable) */}
            {partial && (
              <div className="flex items-center gap-1.5 text-orange-500 text-[10px] font-bold">
                <AlertTriangle size={11} strokeWidth={2.5} />
                <span>
                  {failedTasks.map(t => TASK_LABELS[t] ?? t).join(", ")} failed — content intact
                </span>
              </div>
            )}

            <div className="flex justify-between items-center h-10">
              {hasGSCPermissions ? (
                <div className="flex items-center gap-3">
                  <div className="tooltip" data-tip="GSC Clicks">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-600 cursor-help">
                      <MousePointerClick size={12} /> {blog.gscClicks || 0}
                    </div>
                  </div>
                  <div className="tooltip" data-tip="GSC Impressions">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 cursor-help">
                      <Eye size={12} /> {blog.gscImpressions || 0}
                    </div>
                  </div>
                </div>
              ) : (
                <div />
              )}

              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm">
                <ArrowUpRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Manual Mode badge */}
        {isManualEditor && (
          <div className="absolute top-0 right-10">
            <div className="bg-slate-800 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-b-lg shadow-md border-x border-b border-indigo-500/30">
              Manual Mode
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogCard

import React, { useState } from "react"
import { Popover, Tooltip } from "antd"
import {
  Sparkles,
  Calendar,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trash2,
  ArchiveRestore,
  MousePointerClick,
  Eye,
  AlertCircle,
} from "lucide-react"

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

const statusColors = {
  complete: "border-emerald-500",
  failed: "border-rose-500",
  pending: "border-amber-500",
  "in-progress": "border-amber-500",
}

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "pending" || status === "in-progress") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-600">
        <Loader2 size={12} className="animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Generating</span>
      </div>
    )
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600">
        <AlertCircle size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Failed</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-600">
      <CheckCircle2 size={12} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Published</span>
    </div>
  )
}

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const stripMarkdown = (text: string) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }

  const isManualEditor = blog.isManuallyEdited === true
  const isRunning = blog.status === "pending" || blog.status === "in-progress"
  const isGemini = /gemini/gi.test(blog.aiModel)
  const isChatGPT = /gpt|openai/gi.test(blog.aiModel)
  const isClaude = /claude/gi.test(blog.aiModel)
  const { focusKeywords } = blog

  const handleActionsPopover = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPopoverOpen(!isPopoverOpen)
  }

  const handleRetryClick = () => {
    setIsPopoverOpen(false)
    handlePopup({
      title: "Regenerate Blog",
      description: (
        <span className="my-2">
          Are you sure you want to retry generating <b>{blog.title}</b>?
        </span>
      ),
      confirmText: "Yes, Retry",
      onConfirm: () => onRetry(blog._id),
      confirmProps: {
        type: "text",
        className: "border-emerald-500 bg-emerald-50 text-emerald-600",
      },
    })
  }

  const handleArchiveClick = () => {
    setIsPopoverOpen(false)
    handlePopup({
      title: "Move to Trash",
      description: (
        <span className="my-2">
          <b>{blog.title}</b> will be moved to trash. You can restore it later.
        </span>
      ),
      confirmText: "Move to Trash",
      onConfirm: () => onArchive?.(blog._id),
      confirmProps: {
        type: "text",
        className: "border-rose-500 hover:bg-rose-500 bg-rose-100 text-rose-600 font-bold",
      },
    })
  }

  const actions = (
    <div className="flex flex-col gap-1 w-32">
      {blog.status === "failed" && !isTrashcan && (
        <button
          onClick={handleRetryClick}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left font-medium"
        >
          <RotateCcw size={14} /> Retry
        </button>
      )}
      {!isTrashcan && onArchive && (
        <button
          onClick={handleArchiveClick}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-left font-medium"
        >
          <Trash2 size={14} /> Trash
        </button>
      )}
      {isTrashcan && onRestore && (
        <button
          onClick={() => {
            onRestore(blog._id)
            setIsPopoverOpen(false)
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-left font-medium"
        >
          <ArchiveRestore size={14} /> Restore
        </button>
      )}
    </div>
  )

  const cardBorderClass = isManualEditor
    ? "border-slate-400"
    : statusColors[blog.status] || "border-slate-200"

  const displayModel = blog.aiModelVer
    ? blog.aiModelVer.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : isGemini
      ? "Gemini 2.0 Flash"
      : blog.aiModel || "AI Generated"

  return (
    <div
      className={`group flex flex-col bg-white rounded-xl border-2 ${cardBorderClass} p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer min-h-[380px] h-full relative overflow-hidden`}
      onClick={() => {
        if (!isRunning) {
          if (isManualEditor) {
            onManualBlogClick(blog)
          } else {
            onBlogClick(blog)
          }
        }
      }}
    >
      {/* Header: Model & Options */}
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
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
              Model
            </span>
            <span className="text-xs font-black text-slate-700 leading-none">{displayModel}</span>
          </div>
        </div>
        <Popover
          content={actions}
          trigger="click"
          open={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          placement="bottomRight"
        >
          <button
            className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-xl transition-all active:scale-95"
            onClick={handleActionsPopover}
          >
            <MoreVertical size={18} />
          </button>
        </Popover>
      </div>

      {/* Main Content */}
      <div className="min-w-0 mb-6 flex-1">
        <h3 className="text-[15px] font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
          {blog.title || "Untitled Article"}
        </h3>
        <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-3 font-medium">
          {stripMarkdown(blog.shortContent) ||
            (isRunning
              ? "Your AI agent is crafting this article with deep research..."
              : "No excerpt available for this article.")}
        </p>
      </div>

      {/* Tags & GSC Metrics - Pushed to Bottom of content area */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">
            {focusKeywords?.slice(0, 3).map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 text-[9px] font-black rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60 uppercase tracking-tight"
              >
                {tag}
              </span>
            ))}
            {focusKeywords?.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{focusKeywords.length - 3}
              </span>
            )}
          </div>

          {hasGSCPermissions && (blog.gscClicks > 0 || blog.gscImpressions > 0) && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full text-[10px] font-bold">
              <Tooltip title="Google Search Console Clicks">
                <div className="flex items-center gap-1 text-emerald-600 cursor-help">
                  <MousePointerClick size={10} /> {blog.gscClicks}
                </div>
              </Tooltip>
              <div className="h-2 w-px bg-slate-200" />
              <Tooltip title="Google Search Console Impressions">
                <div className="flex items-center gap-1 text-indigo-500 cursor-help">
                  <Eye size={10} /> {blog.gscImpressions}
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Footer - Fixed Alignment */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center h-12">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            <Calendar size={12} strokeWidth={2.5} />
            {new Date(blog.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={blog.status} />
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Indicator Overlay */}
      {isManualEditor && (
        <div className="absolute top-0 right-10">
          <div className="bg-slate-800 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-b-lg shadow-md border-x border-b border-indigo-500/30">
            Manual Mode
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogCard

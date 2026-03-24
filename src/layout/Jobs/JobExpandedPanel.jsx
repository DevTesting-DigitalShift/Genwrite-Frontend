import React, { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag as TagIcon,
  Hash,
  Layers,
  Calendar,
  FileText,
  Megaphone,
  Shield,
  Image as ImageIcon,
  Zap,
  BookOpen,
  BarChart2,
  Link2,
  AlignLeft,
  Youtube,
  Brain,
  Search,
  Sparkles,
  Cpu,
} from "lucide-react"

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold text-[#1B6FC9] uppercase tracking-wider mb-2 flex items-center gap-1">
    {children}
  </p>
)

const Pill = ({ on, label }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      on
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60"
    }`}
  >
    {on ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
    {label}
  </span>
)

const Tag = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap ${colors[color]}`}
    >
      {children}
    </span>
  )
}

const TagList = ({ items, color }) => {
  if (!items?.length) return <span className="text-slate-300 text-[11px] italic">None</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Tag key={i} color={color}>
          {item}
        </Tag>
      ))}
    </div>
  )
}

const ExpandableTagList = ({ items, color, limit = 10 }) => {
  const [expanded, setExpanded] = useState(false)
  if (!items?.length) return <span className="text-slate-300 text-[11px] italic">No data</span>

  const displayItems = expanded ? items : items.slice(0, limit)
  const hasMore = items.length > limit

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap gap-2 items-center transition-all duration-300 ${
          expanded
            ? "max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200"
            : ""
        }`}
      >
        {displayItems.map((item, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all shadow-xs ${
              color === "indigo"
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "bg-sky-50 text-sky-600 border-sky-100"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={e => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              +{items.length - limit} more <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  )
}

const KV = ({ label, value, valueClass = "text-slate-700" }) => (
  <div className="flex justify-between items-start gap-3 text-[11px]">
    <span className="text-slate-400 shrink-0">{label}</span>
    <span className={`font-semibold text-right capitalize ${valueClass}`}>{value ?? "—"}</span>
  </div>
)

const JobExpandedPanel = ({ job }) => {
  const blogs = job.blogs || {}
  const options = job.options || {}
  const schedule = job.schedule || {}

  const OPTION_MAP = [
    { key: "wordpressPosting", label: "Automatic Posting", icon: Globe },
    { key: "includeFaqs", label: "FAQ", icon: BookOpen },
    { key: "includeTableOfContents", label: "TOC", icon: AlignLeft },
    { key: "includeCompetitorResearch", label: "Competitor Research", icon: BarChart2 },
    { key: "includeInterlinks", label: "Interlinks", icon: Link2 },
    { key: "performKeywordResearch", label: "Keyword Research", icon: Hash },
    { key: "addOutBoundLinks", label: "Outbound Links", icon: Link2 },
    { key: "embedYouTubeVideos", label: "YouTube Embed", icon: Youtube },
    { key: "easyToUnderstand", label: "Easy Language", icon: BookOpen },
    { key: "extendedThinking", label: "Extended Thinking", icon: Brain },
    { key: "deepResearch", label: "Deep Research", icon: Search },
    { key: "humanisation", label: "Humanisation", icon: Sparkles },
  ]

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const scheduleDays =
    schedule.type === "weekly" && schedule.daysOfWeek?.length
      ? schedule.daysOfWeek.map(d => DAY_NAMES[d]).join(", ")
      : schedule.type === "monthly" && schedule.daysOfMonth?.length
        ? schedule.daysOfMonth.join(", ")
        : null

  const imageSrcLabel =
    { stock: "Stock Photos", ai: "AI Generated", none: "No Images" }[blogs.imageSource] ||
    blogs.imageSource ||
    "—"

  const hasTopics = (blogs.topics || []).length > 0
  const hasKeywords = (blogs.keywords || []).length > 0
  const hasTopContent = hasTopics || hasKeywords

  return (
    <div className="mx-4 mb-6 mt-2 rounded-[24px] border border-indigo-100 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* ── Top accent bar ── */}
      <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-blue-500 to-purple-500" />

      {/* ── Row 1: Topics & Keywords ── */}
      {hasTopContent && (
        <div className="p-6 bg-slate-50/40 border-b border-indigo-50">
          <div
            className={`grid grid-cols-1 ${hasTopics && hasKeywords ? "md:grid-cols-2" : ""} gap-10`}
          >
            {hasTopics && (
              <div className="space-y-3">
                <SectionLabel>
                  <TagIcon size={10} className="text-indigo-500" />
                  Automation Topics
                </SectionLabel>
                <ExpandableTagList items={blogs.topics} color="indigo" limit={6} />
              </div>
            )}
            {hasKeywords && (
              <div className="space-y-3">
                <SectionLabel>Target Keywords</SectionLabel>
                <ExpandableTagList items={blogs.keywords} color="sky" limit={6} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* ── Col 1: Blog Specification ── */}
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionLabel>
              <Layers size={10} />
              Structure & Style
            </SectionLabel>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
              <div className="mb-2">
                <p className="text-[10px] text-slate-400 mb-1 font-bold">Templates</p>
                <TagList items={blogs.templates} color="amber" />
              </div>
              <KV label="Voice Tone" value={blogs.tone} />
              <KV
                label="Article Length"
                value={
                  blogs.userDefinedLength
                    ? `${blogs.userDefinedLength.toLocaleString()} words`
                    : "Auto"
                }
              />
              <KV label="Language" value={blogs.languageToWrite} />
              <KV label="AI Model" value={blogs.aiModel?.toUpperCase()} />
              <div className="pt-2 mt-2 border-t border-slate-100/50 space-y-2">
                <KV
                  label="Cost Cutter"
                  value={blogs.costCutter ? "Optimized" : "Disabled"}
                  valueClass={blogs.costCutter ? "text-emerald-600 font-bold" : "text-slate-400"}
                />
                <KV
                  label="Post CTA"
                  value={blogs.addCTA ? "Enabled" : "Disabled"}
                  valueClass={blogs.addCTA ? "text-indigo-600 font-bold" : "text-slate-400"}
                />
              </div>
            </div>
          </div>

          {/* Moved Reference URLs here */}
          {(blogs.references || []).length > 0 && (
            <div className="space-y-3 mt-8">
              <SectionLabel>
                <FileText size={10} className="text-emerald-500" />
                Reference URLs
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {blogs.references.map((item, i) => (
                  <a
                    key={i}
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-2 bg-white/50 p-1.5 rounded-lg border border-indigo-50/50 break-all w-full"
                  >
                    <Link2 size={12} className="shrink-0" />
                    <span className="break-all">{item}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Imagery Config moved here to fill left column space */}
          <div className="space-y-3 mt-8">
            <SectionLabel>
              <ImageIcon size={10} />
              Imagery Config
            </SectionLabel>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
              <KV
                label="Image Source"
                value={blogs.imageSource === "none" ? "Not Enabled" : imageSrcLabel}
                valueClass={blogs.imageSource === "none" ? "text-slate-400" : "text-slate-700"}
              />
              {blogs.imageSource !== "none" && (
                <KV label="Images Count" value={blogs.numberOfImages || "AI Choice"} />
              )}
            </div>
          </div>
        </div>

        {/* ── Col 2: Deployment & Results ── */}
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionLabel>
              <Calendar size={10} />
              Schedule & Run
            </SectionLabel>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
              <KV
                label="Type"
                value={schedule.type || "Manual"}
                valueClass="text-slate-900 font-bold"
              />
              {scheduleDays && <KV label="Active On" value={scheduleDays} />}
              <KV label="Volume" value={`${blogs.numberOfBlogs} Blogs / Run`} />
            </div>
          </div>

          <div className="space-y-3">
            <SectionLabel>
              <FileText size={10} />
              Stats & Logs
            </SectionLabel>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
              <KV
                label="Last Activity"
                value={
                  job.lastRun
                    ? new Date(job.lastRun).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Never"
                }
              />
              <KV
                label="Total Generated"
                value={`${job.createdBlogs?.length ?? 0} Blogs`}
                valueClass="text-slate-900 font-bold"
              />
              <KV
                label="Internal ID"
                value={`#${job._id?.slice(-8)}`}
                valueClass="font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Col 3: Advanced Engine ── */}
        <div className="xl:col-span-1 md:col-span-2 xl:col-start-3">
          <SectionLabel>
            <Zap size={10} />
            Advanced Features
          </SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3 mt-2">
            {OPTION_MAP.map(({ key, label, icon: Icon }) => {
              const isOn = !!options[key]
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                    isOn
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-700 shadow-xs"
                      : "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon size={12} className={isOn ? "text-emerald-500" : "text-slate-300"} />
                    <span className="truncate">{label}</span>
                  </div>
                  {isOn ? (
                    <span className="text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded text-[8px] uppercase shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="text-slate-400 bg-slate-100/50 px-1.5 py-0.5 rounded text-[8px] uppercase shrink-0">
                      Off
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-3 mt-4">
            <SectionLabel>
              <Megaphone size={10} />
              Brand Assets
            </SectionLabel>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[11px] font-bold transition-all shadow-xs ${
                blogs.useBrandVoice
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-slate-50 border-slate-100 text-slate-400"
              }`}
            >
              <Shield
                size={14}
                className={blogs.useBrandVoice ? "text-purple-500" : "text-slate-300"}
              />
              {blogs.useBrandVoice ? "Brand Voice Identity Active" : "No Brand Voice Applied"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobExpandedPanel

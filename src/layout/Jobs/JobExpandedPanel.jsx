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
  Settings2,
  Clock,
} from "lucide-react"

import { brandsQuery } from "@api/Brand/Brand.query"

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold text-[#4C5BD6] uppercase tracking-wider mb-2 flex items-center gap-1">
    {children}
  </p>
)

const Pill = ({ on, label }) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
      on
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-slate-100 text-slate-600 border-slate-200 opacity-90"
    }`}
  >
    {on ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
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

const ExpandableTagList = ({ items, color, limit = 20 }) => {
  const [expanded, setExpanded] = useState(false)
  if (!items?.length) return <span className="text-slate-300 text-[11px] italic">No data</span>

  const displayItems = expanded ? items : items.slice(0, limit)
  const hasMore = items.length > limit

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-wrap gap-2 items-center transition-all duration-300 ${
          expanded
            ? "max-h-[500px] overflow-y-auto pr-3 custom-scroll"
            : ""
        }`}
      >
        {displayItems.map((item, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all shadow-xs ${
              color === "indigo"
                ? "bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:border-indigo-300"
                : "bg-sky-50 text-sky-600 border-sky-100/50 hover:border-sky-300"
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
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-black bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show all {items.length} items <ChevronDown size={12} />
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

const formatDate = (date) => {
  if (!date) return "Never";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const FrequencyDisplay = ({ type, daysOfWeek, daysOfMonth }) => {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (type === "weekly" && daysOfWeek?.length) {
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
    return (
      <div className="flex flex-wrap gap-1 justify-end">
        {sortedDays.map(d => (
          <span
            key={d}
            className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold"
          >
            {DAY_NAMES[d]}
          </span>
        ))}
      </div>
    )
  }

  if (type === "monthly" && daysOfMonth?.length) {
    // If all 31 days are selected, just say "Every Day"
    if (daysOfMonth.length >= 28) {
      const isComplete = [1, 2, 3, 4, 5, 10, 15, 20, 25, 28].every(d => daysOfMonth.includes(d))
      if (isComplete && daysOfMonth.length >= 30) {
        return <span className="text-indigo-600 font-bold">Every Day</span>
      }
    }

    const sorted = [...new Set(daysOfMonth)].map(Number).sort((a, b) => a - b)
    const ranges = []
    let start = sorted[0]
    let end = start

    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === end + 1) {
        end = sorted[i]
      } else {
        ranges.push(start === end ? `${start}` : `${start}–${end}`)
        if (i < sorted.length) {
          start = sorted[i]
          end = start
        }
      }
    }

    return (
      <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
        {ranges.map((range, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-bold"
          >
            {range}
          </span>
        ))}
      </div>
    )
  }

  return null
}

const JobExpandedPanel = ({ job }) => {
  const { data: brands = [] } = brandsQuery.useList()
  const blogs = job.blogs || {}
  const options = job.options || {}
  const schedule = job.schedule || {}

  const sectionStyle = "bg-white p-5 space-y-4 h-full border-r border-slate-100 last:border-r-0 flex flex-col"
  const gridGroupStyle = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"


  const imageSrcLabel =
    { stock: "Stock Photos", ai: "AI Generated", none: "No Images" }[blogs.imageSource] ||
    blogs.imageSource ||
    "—"

  const hasTopics = (blogs.topics || []).length > 0
  const hasKeywords = (blogs.keywords || []).length > 0

  // Lookup brand name
  const brandName = blogs.brandId
    ? brands.find(b => b._id === blogs.brandId)?.nameOfVoice || `ID: ...${blogs.brandId.slice(-6)}`
    : "Default Global Voice"

  return (
    <div className="mx-4 mb-8 mt-4 rounded-[28px] border border-slate-200 bg-slate-50/30 overflow-hidden shadow-inner">
      {/* ── Top Strategy Bar ── */}
      {(hasTopics || hasKeywords) && (
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col gap-6">
            {hasTopics && (
              <div className="space-y-3">
                <SectionLabel>
                  <TagIcon size={10} className="text-indigo-500" />
                  Automation Strategy / Topics
                </SectionLabel>
                <div className="w-full">
                  <ExpandableTagList items={blogs.topics} color="indigo" limit={30} />
                </div>
              </div>
            )}
            {hasKeywords && (
              <div className="space-y-3">
                <SectionLabel>
                  <Hash size={10} className="text-sky-500" />
                  Target Keywords
                </SectionLabel>
                <div className="w-full">
                  <ExpandableTagList items={blogs.keywords} color="sky" limit={30} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Data Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Content Engine */}
        <div className={sectionStyle}>
          <SectionLabel>
            <Cpu size={10} /> Content Specification
          </SectionLabel>
          <div className="space-y-2.5">
            <div className="pb-2">
              <p className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-tighter">
                Selected Templates
              </p>
              <TagList items={blogs.templates} color="amber" />
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <KV
                label="AI Engine"
                value={blogs.aiModel?.toUpperCase() || "GEMINI"}
                valueClass="text-indigo-600"
              />
              <KV label="Writing Tone" value={blogs.tone} />
              <KV label="Language" value={blogs.languageToWrite || "English"} />
              <KV
                label="Target Length"
                value={blogs.userDefinedLength ? `${blogs.userDefinedLength} words` : "Auto"}
              />
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 mt-auto">
                <Pill on={blogs.costCutter} label="Cost Cutter" />
                <Pill
                  on={blogs.easyToUnderstand || options.easyToUnderstand}
                  label="Simple Language"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Strategic Automation */}
        <div className={sectionStyle}>
          <SectionLabel>
            <Sparkles size={10} /> Intelligence & Structure
          </SectionLabel>
          <div className="grid grid-cols-1 gap-2">
            <Pill on={options.includeFaqs} label="FAQ Generation" />
            <Pill on={options.performKeywordResearch} label="Keyword Research" />
            <Pill on={options.includeCompetitorResearch} label="Competitor Analysis" />
            <Pill on={options.deepResearch || blogs.deepResearch} label="Deep Research" />
            <Pill on={options.humanisation || blogs.humanisation} label="Humanisation" />
            <Pill on={options.embedYouTubeVideos} label="YouTube Embeds" />
          </div>
        </div>

        {/* Card 3: Media & Connectivity */}
        <div className={sectionStyle}>
          <SectionLabel>
            <ImageIcon size={10} /> Imagery & Rich Media
          </SectionLabel>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Source Selection</p>
              <p className="text-sm font-black text-slate-900">{imageSrcLabel}</p>
              <p className="text-[9px] text-slate-400">
                {blogs.numberOfImages > 0 ? `${blogs.numberOfImages} images per post` : "Automatic selection"}
              </p>
            </div>

            {(blogs.references || []).length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">
                  Reference Links
                </p>
                <div className="space-y-1.5">
                  {blogs.references.map((url, i) => (
                    <a
                      key={url + i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-lg text-[10px] text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Link2 size={10} /> <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Logistics & Branding */}
        <div className={sectionStyle}>
          <SectionLabel>
            <Settings2 size={10} /> Logistics & Posting
          </SectionLabel>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <KV
                label="Schedule"
                value={schedule.type || "Manual"}
                valueClass="text-indigo-600 font-bold"
              />
              <KV
                label="Batch Size"
                value={`${blogs.numberOfBlogs || 1} blog(s) per run`}
              />
              {/* Only show frequency row if it's weekly/monthly with valid selected days */}
              {(((schedule.type === "weekly" && schedule.daysOfWeek?.length > 0) || 
                 (schedule.type === "monthly" && schedule.daysOfMonth?.length > 0))) && (
                <div className="flex justify-between items-start gap-3 text-[11px]">
                  <span className="text-slate-400 shrink-0">Frequency</span>
                  <FrequencyDisplay
                    type={schedule.type}
                    daysOfWeek={schedule.daysOfWeek}
                    daysOfMonth={schedule.daysOfMonth}
                  />
                </div>
              )}
              <KV
                label="Last Run"
                value={formatDate(job.lastRun)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${blogs.useBrandVoice ? "bg-purple-50 border-purple-100" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Shield
                    size={12}
                    className={blogs.useBrandVoice ? "text-purple-600" : "text-slate-400"}
                  />
                  <span
                    className={`text-[10px] font-bold ${blogs.useBrandVoice ? "text-purple-700" : "text-slate-500"}`}
                  >
                    Brand Identity
                  </span>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <span className="text-[10px] text-slate-500">{brandName}</span>
                  <Pill on={blogs.addCTA} label="CTA" />
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${options.wordpressPosting ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Globe
                    size={12}
                    className={options.wordpressPosting ? "text-emerald-600" : "text-slate-400"}
                  />
                  <span
                    className={`text-[10px] font-bold ${options.wordpressPosting ? "text-emerald-700" : "text-slate-500"}`}
                  >
                    Auto Posting
                  </span>
                </div>
                <div className="pl-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-black">
                      {blogs.postingType || "DRAFT"}
                    </span>
                    {/* <Pill on={options.wordpressPosting} label="Live" /> */}
                    <Pill on={options.includeTableOfContents} label="Table of Contents" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Pill on={options.addOutBoundLinks} label="Outbound" />
              <Pill on={options.includeInterlinks} label="Interlinks" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobExpandedPanel

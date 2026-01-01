import React from "react"
import { Badge, Button, Tooltip, Flex, Typography, Tag } from "antd"
import { RotateCcw, Trash2, MousePointerClick, Eye, ArchiveRestore } from "lucide-react"

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
  handlePopup: (config: any) => void
  hasGSCPermissions?: boolean
  isTrashcan?: boolean
}

const TRUNCATE_LENGTH = 160

const { Text, Title, Paragraph } = Typography

const styleAiModel: (str: string) => string = str => {
  let arr = str.split("-")
  if (arr.length > 3) {
    arr = arr.slice(0, 3)
  }
  const model = arr.join(" ")
  return model[0].toUpperCase() + model.substring(1)
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
  const truncateContent = (content: string, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const stripMarkdown = (text: string) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }

  const isManualEditor = blog.isManuallyEdited === true
  const {
    _id,
    title,
    status,
    createdAt,
    shortContent,
    aiModel,
    aiModelVer,
    focusKeywords,
    updatedAt,
    agendaNextRun,
    isArchived,
    archiveDate,
    gscClicks,
    gscImpressions,
  } = blog
  const isGemini = /gemini/gi.test(aiModel)

  return (
    <Badge.Ribbon
      key={_id}
      text={
        <span className="flex items-center justify-center gap-0.5 sm:gap-1 py-0.5 sm:py-1 px-1 sm:px-2 font-medium tracking-wide text-[10px] sm:text-xs md:text-sm">
          {isManualEditor ? (
            <span className="hidden sm:inline">Manually Generated</span>
          ) : (
            <>
              <img
                src={`./Images/${
                  isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                }.webp`}
                alt={isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"}
                width={14}
                height={14}
                loading="lazy"
                className="bg-white w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="hidden sm:inline">
                {aiModelVer
                  ? styleAiModel(aiModelVer)
                  : isGemini
                  ? "Gemini 2.0 flash"
                  : aiModel === "claude"
                  ? "Claude 4 sonnet"
                  : "Gpt 4.1 nano"}
              </span>
            </>
          )}
        </span>
      }
      className="absolute top-0 shadow-sm"
      color={
        isManualEditor
          ? "#9CA3AF"
          : isGemini
          ? "#4796E3"
          : aiModel === "claude"
          ? "#9368F8"
          : "#74AA9C"
      }
    >
      <div
        className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 min-h-[160px] sm:min-h-[180px] md:min-h-[200px] min-w-0 relative h-full flex flex-col ${
          isManualEditor
            ? "border-gray-500"
            : status === "failed"
            ? "border-red-500"
            : status === "pending" || status === "in-progress"
            ? "border-yellow-500"
            : "border-green-500"
        } border-2`}
      >
        {/* Date Badge */}
        <div className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1.5 sm:mb-2 -mt-1 sm:-mt-2">
          {new Date(createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </div>

        {/* Title and Content */}
        <Tooltip
          title={
            <span className="text-sm sm:text-base">
              {status === "complete"
                ? title
                : status === "failed"
                ? "Blog generation failed"
                : status === "pending"
                ? `Pending Blog will be generated 
                ${
                  agendaNextRun
                    ? "at " +
                      new Date(agendaNextRun).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "shortly"
                }
                `
                : `Blog generation is ${status}`}
            </span>
          }
          color={status === "complete" ? "" : status === "failed" ? "red" : "#eab308"}
        >
          <div
            className="cursor-pointer mb-2 sm:mb-3 flex-1"
            onClick={() => {
              if (status === "complete" || status === "failed") {
                isManualEditor ? onManualBlogClick(blog) : onBlogClick(blog)
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={e =>
              e.key === "Enter" && (status === "complete" || status === "failed") && isManualEditor
                ? onManualBlogClick(blog)
                : onBlogClick(blog)
            }
            aria-label={`View blog ${title}`}
          >
            <Flex justify="space-between" gap="small" align="center" vertical>
              <Title
                title={title}
                level={4}
                className="!text-sm sm:!text-base md:!text-lg line-clamp-2 text-center text-balance !mb-1 sm:!mb-2"
              >
                {title}
              </Title>
              <Paragraph
                ellipsis={{ rows: 2, expandable: false }}
                className="break-all !text-xs sm:!text-sm !mb-0 text-slate-500"
              >
                {truncateContent(stripMarkdown(shortContent)) ||
                  (status === "pending" ? "Content will be generated shortly..." : "")}
              </Paragraph>
            </Flex>
          </div>
        </Tooltip>

        {/* Keywords and Actions */}
        <Flex
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 mt-auto pt-2"
          wrap
        >
          {/* Keywords */}
          <Flex gap="small" wrap className="flex-1 min-w-0">
            {focusKeywords?.slice(0, 3).map((keyword, index) => (
              <Tag
                key={index}
                color="blue"
                className="text-blue-800 text-[10px] sm:text-xs tracking-wide font-montserrat font-semibold px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full m-0 border-none bg-blue-50"
              >
                {keyword}
              </Tag>
            ))}
            {focusKeywords?.length > 3 && (
              <Tag
                color="default"
                className="text-gray-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full m-0 border-none bg-slate-100"
              >
                +{focusKeywords.length - 3}
              </Tag>
            )}
          </Flex>

          {/* Action Buttons */}
          <Flex gap="small" className="flex-shrink-0">
            {!isTrashcan && status === "failed" && (
              <Button
                type="text"
                size="small"
                className="!p-1 sm:!p-1.5 md:!p-2 hover:!border-blue-500 hover:text-blue-500 min-w-0"
                aria-label="Regenerate Blog"
                onClick={e => {
                  e.stopPropagation()
                  handlePopup({
                    title: "Regenerate Blog",
                    description: (
                      <span className="my-2">
                        Are you sure you want to retry generating <b>{title}</b> blog?
                      </span>
                    ),
                    confirmText: "Yes",
                    onConfirm: () => {
                      onRetry(_id)
                    },
                    confirmProps: {
                      type: "text",
                      className: "border-green-500 bg-green-50 text-green-600",
                    },
                    cancelProps: {
                      danger: false,
                    },
                  })
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
            )}

            {isTrashcan && onRestore && (
              <Button
                type="text"
                size="small"
                className="!p-1 sm:!p-1.5 md:!p-2 hover:!border-blue-500 hover:text-blue-500 min-w-0"
                aria-label="Restore Blog"
                onClick={e => {
                  e.stopPropagation()
                  onRestore(_id)
                }}
              >
                <ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
            )}

            {!isTrashcan && onArchive && (
              <Button
                type="text"
                size="small"
                className="!p-1 sm:!p-1.5 md:!p-2 hover:!border-red-500 hover:text-red-500 min-w-0"
                onClick={e => {
                  e.stopPropagation()
                  handlePopup({
                    title: "Move to Trash",
                    description: (
                      <span className="my-2">
                        Blog <b>{title}</b> will be moved to trash. You can restore it later.
                      </span>
                    ),
                    confirmText: "Delete",
                    onConfirm: () => {
                      onArchive(_id)
                    },
                    confirmProps: {
                      type: "text",
                      className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
                    },
                    cancelProps: {
                      danger: false,
                    },
                  })
                }}
                aria-label={`Move blog ${title} to trash`}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Footer Section */}
        <Flex vertical gap="small" className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          {/* GSC Metrics Display */}
          {hasGSCPermissions && (gscClicks > 0 || gscImpressions > 0) && (
            <Flex gap="small" wrap className="justify-center sm:justify-start">
              <Tooltip title="Total clicks from Google Search Console" color="#2E7D32">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium shadow-sm hover:shadow-md transition-shadow cursor-default">
                  <MousePointerClick className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="font-semibold">{gscClicks?.toLocaleString() || 0}</span>
                  <span className="text-green-600 hidden md:inline ml-1">clicks</span>
                </div>
              </Tooltip>
              <Tooltip title="Total impressions from Google Search Console" color="#1565C0">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium shadow-sm hover:shadow-md transition-shadow cursor-default">
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="font-semibold">{gscImpressions?.toLocaleString() || 0}</span>
                  <span className="text-blue-600 hidden md:inline ml-1">impressions</span>
                </div>
              </Tooltip>
            </Flex>
          )}

          {/* Updated Date */}
          <Text
            type="secondary"
            className="text-[10px] sm:text-xs md:text-sm text-center sm:text-left"
          >
            {isArchived ? "Archived: " : "Updated: "}
            {new Date(isArchived ? archiveDate : updatedAt).toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </Text>
        </Flex>
      </div>
    </Badge.Ribbon>
  )
}

export default BlogCard

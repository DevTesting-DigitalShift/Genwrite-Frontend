import React from "react"
import { Badge, Button, Tooltip, Flex, Typography, Tag } from "antd"
import { RotateCcw, Trash2 } from "lucide-react"

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
}

interface BlogCardProps {
  blog: Blog
  onBlogClick: (blog: Blog) => void
  onManualBlogClick: (blog: Blog) => void
  onRetry: (id: string) => void
  onArchive: (id: string) => void
  handlePopup: (config: any) => void
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
  handlePopup,
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
  } = blog
  const isGemini = /gemini/gi.test(aiModel)

  return (
    <Badge.Ribbon
      key={_id}
      text={
        <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide text-xs sm:text-sm">
          {isManualEditor ? (
            <>Manually Generated</>
          ) : (
            <>
              <img
                src={`./Images/${
                  isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                }.png`}
                alt={isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"}
                width={16}
                height={16}
                loading="lazy"
                className="bg-white"
              />
              {aiModelVer
                ? styleAiModel(aiModelVer)
                : isGemini
                ? "Gemini 2.0 flash"
                : aiModel === "claude"
                ? "Claude 4 sonnet"
                : "Gpt 4.1 nano"}
            </>
          )}
        </span>
      }
      className="absolute top-0"
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
        className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-lg p-4 sm:p-6 min-h-[180px] min-w-0 relative ${
          isManualEditor
            ? "border-gray-500"
            : status === "failed"
            ? "border-red-500"
            : status === "pending" || status === "in-progress"
            ? "border-yellow-500"
            : "border-green-500"
        } border-2`}
        title={title}
      >
        <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
          {new Date(createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </div>

        <Tooltip
          title={
            <span className="text-base">
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
            className="cursor-pointer"
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
            <Flex justify="space-between" gap={"middle"} align="center" vertical className="mb-2">
              <Title title={title} level={4} className="line-clamp-2 text-center text-balance">
                {title}
              </Title>
              <Paragraph ellipsis={{ rows: 2, expandable: false }} className="break-all">
                {truncateContent(stripMarkdown(shortContent)) || ""}
              </Paragraph>
            </Flex>
          </div>
        </Tooltip>

        <Flex className="flex items-center justify-end gap-2">
          <Flex gap={"small"} wrap>
            {focusKeywords?.map((keyword, index) => (
              <Tag
                key={index}
                color="blue"
                className="text-blue-800 text-[length:12px] tracking-wide font-montserrat font-semibold px-2 sm:px-2.5 py-0.5 rounded-full"
              >
                {keyword}
              </Tag>
            ))}
          </Flex>
          {status === "failed" && (
            <Button
              type="text"
              className="p-2 hover:!border-blue-500 hover:text-blue-500"
              aria-label="Regenerate Blog"
              onClick={() =>
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
              }
            >
              <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
            </Button>
          )}
          <Button
            type="text"
            className="p-2 hover:!border-red-500 hover:text-red-500"
            onClick={() =>
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
            }
            aria-label={`Move blog ${title} to trash`}
          >
            <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
          </Button>
        </Flex>

        <Flex
          justify="end"
          className="mt-3 -mb-2 text-xs sm:text-sm text-right text-gray-500 font-medium"
        >
          <Text type="secondary" className="ml-auto">
            {isArchived ? "Archived at: " : "UpdatedAt: "}
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

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowUpCircle,
  ArrowDownAZ,
  ArrowUpAZ,
} from "lucide-react"
import dayjs from "dayjs"

// src/constants/blogFilters.js
export const BLOG_STATUS = {
  ALL: "all",
  COMPLETE: "complete",
  PENDING: "pending",
  FAILED: "failed",
}

export const BLOG_STATUS_OPTIONS = [
  { label: "All Status", icon: <CheckCircle2 size={16} />, value: BLOG_STATUS.ALL },
  { label: "Status: Completed", icon: <CheckCircle2 size={16} />, value: BLOG_STATUS.COMPLETE },
  { label: "Status: Pending", icon: <Hourglass size={16} />, value: BLOG_STATUS.PENDING },
  { label: "Status: Failed", icon: <XCircle size={16} />, value: BLOG_STATUS.FAILED },
]

export const SORT_OPTIONS = [
  { label: "Recently Updated", value: "updatedAt:desc", icon: <ArrowUpCircle size={16} /> },
  { label: "Newest", value: "createdAt:desc", icon: <ArrowUp size={16} /> },
  { label: "Oldest", value: "createdAt:asc", icon: <ArrowDown size={16} /> },
  { label: "A-Z", value: "title:asc", icon: <ArrowUpAZ size={16} /> },
  { label: "Z-A", value: "title:desc", icon: <ArrowDownAZ size={16} /> },
]

export const DATE_PRESETS = [
  {
    label: "Last 7 Days",
    range: [dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Last 30 Days",
    range: [dayjs().subtract(30, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Last 3 Months",
    range: [dayjs().subtract(3, "month").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Last 6 Months",
    range: [dayjs().subtract(6, "month").startOf("day"), dayjs().endOf("day")],
  },
  { label: "Last 1 Year", range: [dayjs().startOf("year"), dayjs()] },
]

export const ITEMS_PER_PAGE = 15
export const ROW_HEIGHT = 280

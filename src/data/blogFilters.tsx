import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UpCircleOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"

// src/constants/blogFilters.js
export const BLOG_STATUS = {
  ALL: "all",
  COMPLETE: "complete",
  PENDING: "pending",
  FAILED: "failed",
}

export const BLOG_STATUS_OPTIONS = [
  { label: "All Status", icon: <CheckCircleOutlined />, value: BLOG_STATUS.ALL },
  { label: "Status: Completed", icon: <CheckCircleOutlined />, value: BLOG_STATUS.COMPLETE },
  { label: "Status: Pending", icon: <HourglassOutlined />, value: BLOG_STATUS.PENDING },
  { label: "Status: Failed", icon: <CloseCircleOutlined />, value: BLOG_STATUS.FAILED },
]

export const SORT_OPTIONS = [
  { label: "Recently Updated", value: "updatedAt:desc", icon: <UpCircleOutlined /> },
  { label: "Newest", value: "createdAt:desc", icon: <ArrowUpOutlined /> },
  { label: "Oldest", value: "createdAt:asc", icon: <ArrowDownOutlined /> },
  { label: "A-Z", value: "title:asc", icon: <SortAscendingOutlined /> },
  { label: "Z-A", value: "title:desc", icon: <SortDescendingOutlined /> },
]

export const DATE_PRESETS = [
  { label: "Last 7 Days", range: [dayjs().subtract(7, "day"), dayjs()] },
  { label: "Last 30 Days", range: [dayjs().subtract(30, "day"), dayjs()] },
  { label: "Last 3 Months", range: [dayjs().subtract(3, "month"), dayjs()] },
  { label: "Last 6 Months", range: [dayjs().subtract(6, "month"), dayjs()] },
  { label: "All", range: [dayjs().startOf("year"), dayjs()] },
]

export const ITEMS_PER_PAGE = 15
export const ROW_HEIGHT = 280

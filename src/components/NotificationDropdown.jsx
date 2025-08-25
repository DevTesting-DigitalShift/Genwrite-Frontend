import { useState, useEffect, useMemo } from "react"
import { Badge, Dropdown, Card, List, Typography, Empty, message, Menu, Spin } from "antd"
import {
  BellFilled,
  BellOutlined,
  CheckOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import { markAllNotificationsAsRead } from "@store/slices/userSlice"
import { getSocket } from "@utils/socket"

const { Text } = Typography

// Map notification types to icons
const typeIconMap = {
  BLOG_CREATED: FileTextOutlined,
  BLOG_GENERATED: FileTextOutlined,
  BLOG_TRASHED: ReloadOutlined,
  BLOG_RESTORED: CheckOutlined,
  BLOG_DELETED: ReloadOutlined,
  BLOG_GENERATION_ERROR: ReloadOutlined,
  JOB_STARTED: ReloadOutlined,
  JOB_HALTED: ReloadOutlined,
  JOB_COMPLETED: CheckOutlined,
  JOB_FAILED_CREDITS: ReloadOutlined,
  JOB_ERROR: ReloadOutlined,
}

// Format date using native Date methods
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/**
 * @param {Object} param0
 * @param {Array} param0.notifications
 * @returns
 */
const NotificationDropdown = ({ notifications }) => {
  const [open, setOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState([])
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.user)

  // Sync local notifications with prop changes
  useEffect(() => {
    if (notifications?.length) {
      setLocalNotifications(notifications)
    }
  }, [notifications])

  // Handle API errors
  useEffect(() => {
    if (error) {
      // Revert optimistic update if API fails
      setLocalNotifications(notifications)
    }
  }, [error, notifications])

  // Optimistically update notification read status
  const handleOpenChange = (flag) => {
    setOpen(flag)
    if (flag && localNotifications.some((n) => !n.read)) {
      // Optimistically mark all notifications as read locally
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      // Dispatch API call to mark notifications as read
      dispatch(markAllNotificationsAsRead())
    }
  }

  const menuItems = useMemo(() => {
    if (localNotifications.length === 0) {
      return [
        {
          key: "empty",
          label: <Empty description="No notifications available" />,
        },
      ]
    }

    return localNotifications.map((item, idx) => {
      const MENUICON = typeIconMap[item.type] || BellOutlined
      return {
        key: idx,
        label: (
          <Menu.Item className="!bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="text-xl text-blue-600 ml-2">
                <MENUICON />
              </div>
              <div>
                <Text strong={!item.read} className="block text-gray-800 text-sm">
                  {item.message}
                </Text>
                <Text type="secondary" className="text-xs">
                  {formatDate(item.createdAt)}
                </Text>
              </div>
            </div>
          </Menu.Item>
        ),
      }
    })
  }, [localNotifications])

  const unreadCount = localNotifications.filter((n) => !n.read).length

  return (
    <Dropdown
      trigger={["click"]}
      open={open}
      onOpenChange={handleOpenChange}
      menu={{
        items: menuItems,
        className: "w-[30vw] max-h-[60vh] top-1 !pb-2",
        title: "Notifications",
      }}
      placement="bottomRight"
      rootClassName="!bg-gray-50 shadow-xl rounded-xl"
    >
      <Badge
        count={unreadCount}
        showZero={false}
        style={{
          backgroundColor: "#1B6FC9",
          color: "#fff",
          fontWeight: "600",
          fontSize: "0.75rem", // ~12px
          lineHeight: "20px",
          // minWidth: "10px",
          // height: "20px",
          width: "10px",
          padding: "0 6px",
          borderRadius: "100%", // 🔵 Make it a circle
          boxShadow: "0 0 0 1px #1B6FC9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          top: "2px",
          right: "2px",
        }}
      >
        <BellOutlined
          className={`text-2xl cursor-pointer transition-colors duration-200 ease-in-out 
      ${unreadCount > 0 ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}
    `}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationDropdown

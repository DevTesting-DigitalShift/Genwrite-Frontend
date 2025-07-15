import React, { useState, useEffect, useMemo } from "react"
import { Badge, Dropdown, Card, List, Typography, Empty, message } from "antd"
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
  BLOG_CREATED: <FileTextOutlined />,
  BLOG_GENERATED: <FileTextOutlined />,
  BLOG_TRASHED: <ReloadOutlined />,
  BLOG_RESTORED: <CheckOutlined />,
  BLOG_DELETED: <ReloadOutlined />,
  BLOG_GENERATION_ERROR: <ReloadOutlined />,
  JOB_STARTED: <ReloadOutlined />,
  JOB_HALTED: <ReloadOutlined />,
  JOB_COMPLETED: <CheckOutlined />,
  JOB_FAILED_CREDITS: <ReloadOutlined />,
  JOB_ERROR: <ReloadOutlined />,
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
      message.error("Failed to mark notifications as read.")
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

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (data) => {
      setLocalNotifications((prev) => [data, ...prev])
    }

    socket.on("notification", handleNewNotification)

    // Cleanup on unmount
    return () => {
      socket.off("notification", handleNewNotification)
    }
  }, [])

  // Memoized notification list content
  const content = useMemo(
    () => (
      <Card
        title={
          <div className="flex items-center justify-center gap-3">
            <BellFilled className="text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">Notifications</span>
          </div>
        }
        className="w-[400px] max-h-[500px] overflow-auto shadow-lg rounded-xl border border-gray-200 mt-4"
        classNames={{
          body: "!pt-2 !px-3",
        }}
      >
        {localNotifications.length === 0 ? (
          <Empty description="No notifications available" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={localNotifications}
            renderItem={(item) => (
              <List.Item
                className={`px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                  !item.read ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
              >
                <List.Item.Meta
                  avatar={
                    <div className="text-xl text-blue-600 ml-2">
                      {typeIconMap[item.type] || <BellOutlined />}
                    </div>
                  }
                  title={
                    <Text strong={!item.read} className="text-base font-medium text-gray-800">
                      {item.message}
                    </Text>
                  }
                  description={
                    <Text type="secondary" className="text-sm">
                      {formatDate(item.createdAt)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    ),
    [localNotifications]
  )

  const unreadCount = localNotifications.filter((n) => !n.read).length

  return (
    <Dropdown
      trigger={["click"]}
      open={open}
      onOpenChange={handleOpenChange}
      overlay={content}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-2, 4]} size="small">
        <BellOutlined
          className={`text-2xl cursor-pointer transition-colors ${
            unreadCount > 0 ? "text-blue-600" : "text-gray-700"
          }`}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationDropdown

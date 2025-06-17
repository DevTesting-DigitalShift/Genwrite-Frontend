import React, { useState, useEffect } from "react"
import { Badge, Dropdown, Card, List, Typography, Empty } from "antd"
import {
  BellFilled,
  BellOutlined,
  CheckOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import axiosInstance from "@api/index"
import { useDispatch } from "react-redux"
import { load } from "@store/slices/authSlice"

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
 *
 * @param {Object} param0
 * @param {Array} param0.notifications
 * @returns
 */
const NotificationDropdown = ({ notifications }) => {
  const [open, setOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState([])
  const dispatch = useDispatch()

  useEffect(() => {
    if (notifications || notifications?.length) setLocalNotifications(notifications)
  }, [notifications])

  // Function to fetch notifications
  // const fetchNotifications = async () => {
  //   try {
  //     const res = await axiosInstance.get("/user/notifications")
  //     setLocalNotifications(res.data.notifications)
  //   } catch (error) {
  //     console.error("Error fetching notifications:", error)
  //   }
  // }

  const loadUser = async () => {
    console.log("Load User")
    await load()(dispatch)
  }

  //[ ] send to layout and use debouncing gap of 60s 

  useEffect(() => {
    // Initial fetch
    // fetchNotifications()

    // Set up interval to fetch notifications every 30 seconds
    const intervalId = setInterval(loadUser, 30000) // 30000ms = 30s

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const unreadCount = localNotifications.filter((n) => !n.read).length

  const handleOpenChange = async (flag) => {
    setOpen(flag)
    if (!flag && unreadCount > 0) {
      try {
        await axiosInstance.patch("/user/notifications/read")
        // Update local state to mark all as read
        const updatedNotifications = localNotifications.map((n) => ({
          ...n,
          read: true,
        }))
        setLocalNotifications(updatedNotifications)
      } catch (error) {
        console.error("Failed to mark notifications as read:", error)
      }
    }
  }

  const content = (
    <Card
      title={
        <>
          <BellFilled />
          <span>Notifications</span>
        </>
      }
      variant="outlined"
      className="w-[400px] max-h-[500px] overflow-auto shadow-xl mt-4"
      classNames={{
        title: "text-blue-500 text-lg !flex justify-center items-center gap-4",
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
              className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 ${
                !item.read ? "bg-gray-50 border-l-4 border-blue-400" : ""
              }`}
            >
              <List.Item.Meta
                avatar={
                  <div className="text-xl text-blue-500 ml-4">
                    {typeIconMap[item.type] || <BellOutlined />}
                  </div>
                }
                title={
                  <Text strong={!item.read} className="font-medium text-base">
                    {item.message}
                  </Text>
                }
                description={<Text type="secondary">{formatDate(item.createdAt)}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )

  return (
    <Dropdown
      trigger={["click"]}
      open={open}
      onOpenChange={handleOpenChange}
      popupRender={() => content}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-2, 4]}>
        <BellOutlined
          className={`text-2xl cursor-pointer ${unreadCount ? "text-blue-600" : "text-black"}`}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationDropdown

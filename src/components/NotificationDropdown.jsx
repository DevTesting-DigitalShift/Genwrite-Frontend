import { useState, useEffect, useRef } from "react"
import {
  Bell,
  CheckCircle,
  FileText,
  Trash2,
  AlertTriangle,
  Play,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import useAuthStore from "@store/useAuthStore"

// Map notification types to lucide icons
const typeIconMap = {
  BLOG_CREATED: { icon: FileText, color: "text-blue-500" },
  BLOG_GENERATED: { icon: FileText, color: "text-green-500" },
  BLOG_TRASHED: { icon: Trash2, color: "text-red-500" },
  BLOG_RESTORED: { icon: CheckCircle, color: "text-emerald-500" },
  BLOG_DELETED: { icon: Trash2, color: "text-red-600" },
  BLOG_GENERATION_ERROR: { icon: AlertTriangle, color: "text-red-500" },
  JOB_STARTED: { icon: Play, color: "text-indigo-500" },
  JOB_HALTED: { icon: XCircle, color: "text-orange-500" },
  JOB_COMPLETED: { icon: CheckCircle, color: "text-green-500" },
  JOB_FAILED_CREDITS: { icon: AlertCircle, color: "text-red-500" },
  JOB_ERROR: { icon: AlertTriangle, color: "text-red-500" },
}

// Format date using native Date methods
const formatDate = dateStr => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const NotificationDropdown = ({ notifications }) => {
  const [localNotifications, setLocalNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const { markAllNotificationsAsRead, error } = useAuthStore()
  const dropdownRef = useRef(null)

  // Sync local notifications with prop changes
  useEffect(() => {
    if (notifications?.length) {
      setLocalNotifications(notifications)
    } else {
      setLocalNotifications([])
    }
  }, [notifications])

  // Handle API errors - revert if needed
  useEffect(() => {
    if (error) {
      setLocalNotifications(notifications || [])
    }
  }, [error, notifications])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const unreadCount = localNotifications.filter(n => !n.read).length

  const handleToggle = () => {
    setIsOpen(!isOpen)

    if (!isOpen && unreadCount > 0) {
      setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })))
      markAllNotificationsAsRead()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button className="btn btn-ghost btn-circle m-1" onClick={handleToggle}>
        <div className="indicator">
          <Bell
            className={`w-6 h-6 transition-colors ${unreadCount > 0 ? "text-blue-600 fill-blue-600/10" : "text-gray-600"}`}
          />
          {unreadCount > 0 && (
            <span className="badge badge-sm badge-primary indicator-item border-white shadow-sm bg-blue-600">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 card card-compact w-80 md:w-96 bg-white shadow-2xl border border-gray-100 mt-2 max-h-[70vh] overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="card-body p-0">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
              {localNotifications.length > 0 && (
                <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-full border border-gray-200">
                  {localNotifications.length} Total
                </span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
              {localNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Bell className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No records found</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {localNotifications.map((item, idx) => {
                    const typeConfig = typeIconMap[item.type] || {
                      icon: Info,
                      color: "text-gray-400",
                    }
                    const Icon = typeConfig.icon

                    return (
                      <li
                        key={idx}
                        className={`border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors duration-150 ${!item.read ? "bg-blue-50/30" : ""}`}
                      >
                        <div className="flex gap-4 p-4 items-start">
                          <div
                            className={`mt-1 p-2 rounded-full bg-white border border-gray-100 shadow-xs ${typeConfig.color}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm wrap-break-words leading-snug ${!item.read ? "font-semibold text-gray-900" : "text-gray-600"}`}
                            >
                              {item.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                          {!item.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown

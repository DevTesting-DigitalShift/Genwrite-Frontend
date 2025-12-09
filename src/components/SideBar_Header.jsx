import { useState, useEffect, useRef, useCallback } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { RxAvatar } from "react-icons/rx"
import { FiMenu } from "react-icons/fi"
import {
  Box,
  Briefcase,
  Crown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Plug,
  Trash2,
  TrendingUp,
  UsersRound,
  Zap,
} from "lucide-react"
import {
  loadAuthenticatedUser,
  logoutUser,
  selectUser,
  updateCredits,
  addNotification,
  updateUserPartial,
} from "../store/slices/authSlice"
import { Tooltip, Dropdown, Avatar } from "antd"
import { RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
import GoProButton from "@components/GoProButton"
import { getSocket } from "@utils/socket"
import WhatsNewModal from "./dashboardModals/HowToModel"

const SideBar_Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const user = useSelector(selectUser)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const sidebarRef = useRef(null) // Ref for sidebar

  // Stable reference to fetch user - wrapped in useCallback
  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log("📡 Socket triggered full user refresh")
      await dispatch(loadAuthenticatedUser()).unwrap()
    } catch (err) {
      console.error("User load failed:", err)
      navigate("/login")
    }
  }, [dispatch, navigate])

  // Handle credits update from socket - granular update when data is provided
  const handleCreditsUpdate = useCallback(
    data => {
      console.log("💰 Credits update received:", data)
      if (
        data &&
        typeof data === "object" &&
        (data.base !== undefined || data.extra !== undefined || data.credits !== undefined)
      ) {
        // If socket sends the credits data directly, update Redux store directly (fast)
        dispatch(updateCredits(data.credits || data))
      } else {
        // Fallback: refetch the entire user
        fetchCurrentUser()
      }
    },
    [dispatch, fetchCurrentUser]
  )

  // Handle notification update from socket - granular update when data is provided
  const handleNotificationUpdate = useCallback(
    data => {
      console.log("🔔 Notification update received:", data)
      if (data && typeof data === "object" && data.message) {
        // If socket sends the notification data directly, add it to Redux store (fast)
        dispatch(addNotification(data))
      } else if (data && typeof data === "object" && data.notifications) {
        // If socket sends all notifications, update user partially
        dispatch(updateUserPartial({ notifications: data.notifications }))
      } else {
        // Fallback: refetch the entire user
        fetchCurrentUser()
      }
    },
    [dispatch, fetchCurrentUser]
  )

  const handleCloseModal = () => {
    setShowWhatsNew(false)
  }

  // Handle outside click to close sidebar
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth < 768 // Only close on mobile (md breakpoint)
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

  // Socket listeners for real-time user updates (credits, notifications)
  useEffect(() => {
    let socket = getSocket()
    let retryCount = 0
    const maxRetries = 10
    let retryTimeout

    const setupListeners = () => {
      if (!socket) {
        socket = getSocket()
        if (!socket && retryCount < maxRetries) {
          retryCount++
          console.log(`⏳ Waiting for socket connection... (attempt ${retryCount}/${maxRetries})`)
          retryTimeout = setTimeout(setupListeners, 500)
          return
        }
        if (!socket) {
          console.warn("⚠️ Socket not available after retries")
          return
        }
      }

      console.log("🔌 Setting up socket listeners for user:credits and user:notification")
      socket.on("user:credits", handleCreditsUpdate)
      socket.on("user:notification", handleNotificationUpdate)
    }

    setupListeners()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (socket) {
        socket.off("user:credits", handleCreditsUpdate)
        socket.off("user:notification", handleNotificationUpdate)
      }
    }
  }, [handleCreditsUpdate, handleNotificationUpdate])

  useEffect(() => {
    fetchCurrentUser()
  }, [dispatch, navigate])

  useEffect(() => {
    if (user?.name || user?.credits) {
      setIsUserLoaded(true)
    }
  }, [user])

  const Menus = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "My Projects", icon: FileText, path: "/blogs" },
    { title: "Blog Performance", icon: TrendingUp, path: "/blog-performance" },
    { title: "Content Agent", icon: Briefcase, path: "/jobs" },
    { title: "Toolbox", icon: Box, path: "/toolbox" },
    { title: "Integrations", icon: Plug, path: "/integrations" },
    { title: "Brand Voice", icon: Megaphone, path: "/brand-voice" },
    { title: "TrashCan", icon: Trash2, path: "/trashcan" },
  ]

  const path = location.pathname

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const userMenu = {
    onClick: ({ key }) => {
      if (key === "logout") handleLogout()
      else navigate(`/${key}`)
    },
    rootClassName: "!px-4 !py-2 rounded-lg shadow-md max-w-[20ch] text-lg !bg-gray-50 gap-4",
    items: [
      {
        key: "name",
        label: (
          <Tooltip
            title={user?.name}
            className="block font-medium text-gray-900 text-center text-lg w-[15ch] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {user?.name}
          </Tooltip>
        ),
        disabled: true,
      },
      { type: "divider" },
      { key: "profile", label: "Profile", className: "!py-1.5 hover:bg-gray-100" },
      {
        key: "transactions",
        label: "Subscription & Transactions",
        className: "!py-1.5 hover:bg-gray-100",
      },
      { key: "credit-logs", label: "Credit Logs", className: "!py-1.5 hover:bg-gray-100" },
      { key: "pricing", label: "Upgrade", className: "!py-1.5 hover:bg-gray-100" },
      { type: "divider" },
      { key: "logout", danger: true, label: "Logout", className: "!py-2 hover:bg-gray-100" },
    ],
  }

  const noUserMenu = {
    onClick: ({ key }) => {
      if (key === "login") navigate("/login")
    },
    rootClassName: "!px-4 !py-2 rounded-lg shadow-md w-[20ch] text-lg !bg-gray-50 gap-4",
    items: [{ key: "login", danger: true, label: "Login", className: "!py-1.5 hover:bg-gray-100" }],
  }

  return (
    <div
      className={`md:z-[999] ${
        path.includes("signup") || path.includes("login") ? "hidden" : "flex"
      }`}
    >
      {/* Sidebar */}
      {showWhatsNew && <WhatsNewModal onClose={handleCloseModal} />}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 bg-[#3F51B5] from-purple-800 to-blue-600 text-white overflow-hidden p-2 flex flex-col ${
          sidebarOpen ? "w-56" : "hidden md:w-16 md:block"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => {
          if (window.innerWidth >= 768) setSidebarOpen(false) // Only close on hover for desktop
        }}
      >
        {/* Logo or menu icon */}
        <div className="flex justify-center items-center h-14 mb-4">
          {!sidebarOpen ? (
            <FiMenu size={24} className="text-white" />
          ) : (
            <img
              src="/Images/logo_genwrite_1.png"
              loading="lazy"
              alt="Logo"
              className="w-52 mt-4"
            />
          )}
        </div>

        {/* Upgrade Button */}
        {sidebarOpen && (
          <div className="mb-6 px-2">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group capitalize"
            >
              {["pro", "enterprise"].includes(user?.subscription?.plan) ? (
                <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              ) : (
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              )}
              <span>{user?.subscription?.plan} Plan</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <ul className="space-y-3">
          {Menus.map((Menu, index) => {
            const isActive = location.pathname.startsWith(Menu.path)
            const Icon = Menu.icon
            const isSearchConsole = Menu.title === ""
            const isContentAgent = Menu.title === ""
            const isPro = ["pro", "enterprise"].includes(user?.subscription?.plan)
            const isFreeUser = user?.plan === "free" || user?.subscription?.plan === "free"

            return (
              <li key={index} className="flex items-center gap-2">
                <NavLink
                  to={Menu.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-white hover:bg-white/10 flex-1 ${
                    isActive ? "bg-white/20 font-semibold" : ""
                  }`}
                >
                  <Icon
                    className="w-5 h-5 transition-all duration-200"
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={`${!sidebarOpen ? "hidden" : "block"}`}>{Menu.title}</span>
                </NavLink>

                {/* Show upgrade icon for Content Agent and free users */}
                {isContentAgent && isFreeUser && sidebarOpen && (
                  <button className="p-1 bg-yellow-500 text-white rounded-md transition-all duration-200 hover:scale-105">
                    <Crown className="w-4 h-4" />
                  </button>
                )}

                {/* Show upgrade icon for Blog Performance and non-pro users */}
                {isSearchConsole && !isPro && sidebarOpen && (
                  <button className="p-1 bg-yellow-500 text-white rounded-md transition-all duration-200 hover:scale-105">
                    <Crown className="w-4 h-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {/* Responsive Sidebar Items (GoProButton and Introduction Video) */}
        {sidebarOpen && (
          <ul className="space-y-3 mt-4 md:hidden">
            <li>
              <button
                onClick={() => navigate("/pricing")}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-white hover:bg-white/10 w-full"
              >
                <Zap className="w-5 h-5" />
                <span>Go Pro</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setShowWhatsNew(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-white hover:bg-white/10 w-full"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Introduction Video</span>
              </button>
            </li>
          </ul>
        )}

        {/* Contact Us - Stick to bottom */}
        <div className="absolute bottom-4 w-full pr-4">
          <NavLink
            to="/contact"
            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-white hover:bg-white/10"
          >
            <UsersRound
              className={`transition-all duration-300 ${
                sidebarOpen ? "w-5 h-5 opacity-100" : "w-5 h-5 opacity-80"
              }`}
            />
            <span className={`${sidebarOpen ? "block" : "hidden"}`}>Contact Us</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-16">
        <header
          className="fixed top-0 z-40 p-4 flex items-center justify-between border-b bg-gradient-to-r from-white/60 via-white/30 to-white/60 backdrop-blur-lg
 border-gray-200 w-full md:w-[calc(100%-4rem)]"
        >
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu size={24} className="text-gray-700" />
            </button>
            <img src="/Images/logo_genwrite_2.png" loading="lazy" alt="Logo" className="w-36" />
          </div>
          <div className="flex items-center space-x-4">
            {user?.subscription?.plan !== "enterprise" && <GoProButton />}
            {isUserLoaded ? (
              <>
                <Tooltip title="User Credits" className="hidden md:flex">
                  <button
                    onClick={() => navigate("/credit-logs")}
                    className="flex gap-2 justify-center items-center rounded-full p-2 hover:bg-gray-100 transition"
                  >
                    <RiCoinsFill size={24} color="orange" />
                    <span className="font-semibold">
                      {user?.credits?.base + user?.credits?.extra || 0}
                    </span>
                  </button>
                </Tooltip>
                <NotificationDropdown notifications={user?.notifications} />
                <Tooltip title="Introduction Video" className="hidden md:flex">
                  <button
                    onClick={() => setShowWhatsNew(true)}
                    className="flex gap-2 justify-center items-center rounded-full p-2 hover:bg-gray-100 transition"
                  >
                    <HelpCircle className="transition-all duration-300 w-7 h-7 text-gray-700" />
                  </button>
                </Tooltip>
                <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
                  <Avatar
                    className="bg-gradient-to-tr from-blue-400 to-purple-700 text-white font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-500 transition"
                    style={{ marginLeft: "20px", marginRight: "20px" }}
                    size="large"
                    src={user?.avatar ? user.avatar : undefined}
                  >
                    {!user?.avatar && user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                </Dropdown>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <RxAvatar size={30} />
                <Dropdown menu={noUserMenu} trigger={["click"]} placement="bottomRight">
                  <span className="text-gray-700 text-sm">UserName</span>
                </Dropdown>
              </div>
            )}
          </div>
        </header>
      </div>
    </div>
  )
}

export default SideBar_Header

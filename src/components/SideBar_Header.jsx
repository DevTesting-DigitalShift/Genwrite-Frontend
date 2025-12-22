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
  ImagesIcon,
  LayoutDashboard,
  Megaphone,
  Menu,
  Plug,
  Sparkles,
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
  const sidebarRef = useRef(null)

  const fetchCurrentUser = useCallback(async () => {
    try {
      await dispatch(loadAuthenticatedUser()).unwrap()
    } catch (err) {
      console.error("User load failed:", err)
      navigate("/login")
    }
  }, [dispatch, navigate])

  const handleCreditsUpdate = useCallback(
    data => {
      if (
        data &&
        typeof data === "object" &&
        (data.base !== undefined || data.extra !== undefined || data.credits !== undefined)
      ) {
        dispatch(updateCredits(data.credits || data))
      } else {
        fetchCurrentUser()
      }
    },
    [dispatch, fetchCurrentUser]
  )

  const handleNotificationUpdate = useCallback(
    data => {
      if (data && typeof data === "object" && data.message) {
        dispatch(addNotification(data))
      } else if (data && typeof data === "object" && data.notifications) {
        dispatch(updateUserPartial({ notifications: data.notifications }))
      } else {
        fetchCurrentUser()
      }
    },
    [dispatch, fetchCurrentUser]
  )

  const handleCloseModal = () => {
    setShowWhatsNew(false)
  }

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth < 768
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

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
          retryTimeout = setTimeout(setupListeners, 500)
          return
        }
        if (!socket) {
          console.warn("⚠️ Socket not available after retries")
          return
        }
      }

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
    { title: "Image Gallery", icon: ImagesIcon, path: "/image-gallery" },
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
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out bg-white border-r border-gray-200 overflow-hidden flex flex-col shadow-sm ${
          sidebarOpen ? "w-64" : "hidden md:w-20 md:flex"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => {
          if (window.innerWidth >= 768) setSidebarOpen(false)
        }}
      >
        {/* Logo Header */}
        <div className="flex items-center mt-3 justify-center h-16 border-b border-gray-200 px-4">
          {!sidebarOpen ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Menu className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <img src="/Images/logo_genwrite_2.png" alt="logo" className="w-full h-12" />
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {sidebarOpen && (
          <div className="p-3">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              {["pro", "enterprise"].includes(user?.subscription?.plan) ? (
                <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              ) : (
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              )}
              <span className="capitalize">{user?.subscription?.plan} Plan</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {Menus.map((Menu, index) => {
              const isActive = location.pathname.startsWith(Menu.path)
              const Icon = Menu.icon
              const isPro = ["pro", "enterprise"].includes(user?.subscription?.plan)
              const isFreeUser = user?.plan === "free" || user?.subscription?.plan === "free"

              return (
                <li key={index}>
                  <NavLink
                    to={Menu.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                        !isActive && "group-hover:scale-110"
                      }`}
                    />
                    {sidebarOpen && (
                      <span className="text-sm font-medium whitespace-nowrap">{Menu.title}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Responsive Sidebar Items (Mobile Only) */}
        {sidebarOpen && (
          <div className="md:hidden p-3 border-t border-gray-200">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">Go Pro</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowWhatsNew(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-gray-100 w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Introduction Video</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Contact Us - Bottom */}
        <div className="p-3 border-t border-gray-200">
          <NavLink
            to="/contact"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-gray-100"
          >
            <UsersRound className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Contact Us</span>}
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-20">
        <header
          className="fixed top-0 z-40 p-4 flex items-center justify-between border-b bg-gradient-to-r from-white/60 via-white/30 to-white/60 backdrop-blur-lg
 border-gray-200 w-full md:w-[calc(100%-5rem)]"
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
                    data-tour="help-icon"
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

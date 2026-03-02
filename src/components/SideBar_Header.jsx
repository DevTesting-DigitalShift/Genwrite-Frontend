import { useState, useEffect, useRef, useCallback } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import useAuthStore from "../store/useAuthStore"
import { RxAvatar } from "react-icons/rx"
import { FiMenu } from "react-icons/fi"
import {
  Briefcase,
  Crown,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plug,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  UsersRound,
  Zap,
} from "lucide-react"
import { RiCashFill, RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
import GoProButton from "@components/GoProButton"
import { getSocket } from "@utils/socket"
import WhatsNewModal from "./dashboardModals/HowToModel"
import ScheduleDemoButton from "@components/ScheduleDemoBtn"
import useViewport from "@/hooks/useViewport"

const SideBar_Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const {
    user,
    loadAuthenticatedUser,
    logoutUser,
    updateCredits,
    addNotification,
    updateUserPartial,
  } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarRef = useRef(null)
  const { isDesktop } = useViewport()

  const fetchCurrentUser = useCallback(async () => {
    try {
      await loadAuthenticatedUser()
    } catch (err) {
      console.error("User load failed:", err)
      navigate("/login")
    }
  }, [loadAuthenticatedUser, navigate])

  const handleCreditsUpdate = useCallback(
    data => {
      if (
        data &&
        typeof data === "object" &&
        (data.base !== undefined || data.extra !== undefined || data.credits !== undefined)
      ) {
        updateCredits(data.credits || data)
      } else {
        fetchCurrentUser()
      }
    },
    [updateCredits, fetchCurrentUser]
  )

  const handleNotificationUpdate = useCallback(
    data => {
      if (data && typeof data === "object" && data.message) {
        addNotification(data)
      } else if (data && typeof data === "object" && data.notifications) {
        updateUserPartial({ notifications: data.notifications })
      } else {
        fetchCurrentUser()
      }
    },
    [addNotification, updateUserPartial, fetchCurrentUser]
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
  }, [fetchCurrentUser])

  useEffect(() => {
    if (user?._id || user?.name || user?.avatar) {
      setIsUserLoaded(true)
    } else {
      setIsUserLoaded(false)
    }
  }, [user])

  const Menus = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "My Projects", icon: FileText, path: "/blogs" },
    { title: "Blog Performance", icon: TrendingUp, path: "/blog-performance" },
    { title: "Content Agent", icon: Briefcase, path: "/jobs" },
    // { title: "Toolbox", icon: Box, path: "/toolbox" }, // Toolbox merged into Dashboard
    { title: "Integrations", icon: Plug, path: "/integrations" },
    { title: "Brand Voice", icon: Megaphone, path: "/brand-voice" },
    { title: "TrashCan", icon: Trash2, path: "/trashcan" },
  ]

  const path = location.pathname

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div
      className={`z-50 ${path.includes("signup") || path.includes("login") ? "hidden" : "flex"}`}
    >
      {/* Sidebar */}
      {showWhatsNew && <WhatsNewModal onClose={handleCloseModal} />}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ease-in-out bg-white border-r border-gray-200 overflow-hidden flex flex-col shadow-sm ${
          sidebarOpen ? "w-64" : "hidden md:w-20 md:flex"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => {
          if (window.innerWidth >= 768) setSidebarOpen(false)
        }}
      >
        {/* Logo Header */}
        <div className="flex items-center mt-2 justify-center h-16 border-b border-gray-200 px-4">
          {!sidebarOpen ? (
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Menu className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <img src="/Images/logo_genwrite_2.webp" alt="logo" className="w-full h-12" />
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {sidebarOpen && (
          <div className="p-3">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full h-14 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 group"
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
              // Special case: highlight /blogs when on /blog/:id (blog editor)
              const isActive =
                location.pathname.startsWith(Menu.path) ||
                (Menu.path === "/blogs" && location.pathname.startsWith("/blog/"))
              const Icon = Menu.icon

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
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                        !isActive && "group-hover:scale-110"
                      }`}
                    />
                    {sidebarOpen && (
                      <span className="text-sm font-semibold whitespace-nowrap">{Menu.title}</span>
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
            <ul className="space-y-2">
              {/* Schedule Demo - Mobile Only */}
              <li>
                <ScheduleDemoButton
                  calLink="genwrite/30min"
                  buttonText="Schedule Demo"
                  variant="linear"
                  size="middle"
                  tooltipText=""
                  showIcon={true}
                  className="w-full! justify-center!"
                />
              </li>
              <li>
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black duration-200 hover:bg-gray-100 w-full"
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">Go Pro</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowWhatsNew(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black duration-200 hover:bg-gray-100 w-full"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black duration-200 hover:bg-gray-100"
          >
            <UsersRound className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Contact Us</span>}
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-20">
        <header className="fixed top-0 z-20 px-4 py-3 flex items-center justify-between border-b bg-linear-to-r from-white/60 via-white/30 to-white/60 backdrop-blur-lg border-gray-200 w-full md:w-[calc(100%-5rem)]">
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu size={24} className="text-gray-700" />
            </button>
            <a href="/dashboard">
              <img src="/Images/logo_genwrite_2.webp" loading="lazy" alt="Logo" className="w-36" />
            </a>
          </div>
          <div className="flex items-center space-x-4">
            {/* Schedule Demo - Hidden on mobile, shown on tablet/desktop */}
            <ScheduleDemoButton
              calLink="genwrite/30min"
              buttonText={isDesktop ? "Schedule a Demo" : "Demo"}
              variant="linear"
              size="large"
              tooltipText="Schedule a free consultation"
              showIcon={isDesktop}
              hideOnMobile={true}
            />
            {user?.subscription?.plan !== "enterprise" && <GoProButton />}
            {isUserLoaded ? (
              <>
                <div className="hidden md:flex tooltip tooltip-bottom" data-tip="User Credits">
                  <button
                    onClick={() => navigate("/credit-logs")}
                    className="flex gap-2 justify-center items-center rounded-full p-2 hover:bg-gray-100 transition text-black"
                  >
                    <RiCoinsFill size={24} color="orange" />
                    <span className="font-semibold text-base">
                      {user?.credits?.base + user?.credits?.extra || 0}
                    </span>
                  </button>
                </div>
                <NotificationDropdown notifications={user?.notifications} />
                <div
                  className="hidden md:flex tooltip tooltip-bottom"
                  data-tip="Introduction Video"
                >
                  <button
                    onClick={() => setShowWhatsNew(true)}
                    className="flex gap-2 justify-center items-center rounded-full p-2 hover:bg-gray-100 transition"
                    data-tour="help-icon"
                  >
                    <HelpCircle className="transition-all duration-300 w-7 h-7 text-gray-700" />
                  </button>
                </div>
                <div className="dropdown dropdown-end relative">
                  <div tabIndex={0} role="button" className="avatar cursor-pointer ml-5 mr-5">
                    <div className="w-12 h-12 rounded-full bg-linear-to-tr from-blue-400 to-purple-700 text-white font-bold flex items-center justify-center overflow-hidden shadow-inner">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">
                          {user?.name?.[0]?.toUpperCase() || <User size={20} />}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul
                    tabIndex={0}
                    className="dropdown-content right-0 z-50 menu p-3 shadow-xl bg-white rounded-xl w-64 mt-2 border border-gray-200"
                  >
                    <li className="menu-title px-4 py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-900 text-lg truncate leading-tight block">
                        {user?.name}
                      </span>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/profile")}
                        className="text-sm font-medium py-2! px-4! hover:bg-blue-50! rounded-lg flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-blue-500" /> Profile
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/transactions")}
                        className="text-sm font-medium py-2! px-4! hover:bg-purple-50! rounded-lg flex items-center gap-2"
                      >
                        <RiCashFill className="w-4 h-4 text-purple-500" /> Subscription &
                        Transactions
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/credit-logs")}
                        className="text-sm font-medium py-2! px-4! hover:bg-orange-50! rounded-lg flex items-center gap-2"
                      >
                        <History className="w-4 h-4 text-orange-500" /> Credit History
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="text-sm font-medium py-2! px-4! hover:bg-amber-50! rounded-lg flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" /> Upgrade Plan
                      </button>
                    </li>
                    <div className="divider my-1"></div>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-red-600 py-2! px-4! hover:bg-red-50! rounded-lg flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <RxAvatar size={30} />
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="text-gray-700 text-sm cursor-pointer">
                    UserName
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-40 mt-2"
                  >
                    <li>
                      <button onClick={() => navigate("/login")} className="text-error font-bold">
                        Login
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>
    </div>
  )
}

export default SideBar_Header

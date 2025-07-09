import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { RxAvatar } from "react-icons/rx"
import { FiMenu } from "react-icons/fi"
import {
  Box,
  Briefcase,
  Crown,
  FileText,
  LayoutDashboard,
  Megaphone,
  Plug,
  Trash2,
  TrendingUp,
  UsersRound,
  Zap,
} from "lucide-react"
import { loadAuthenticatedUser, logoutUser, selectUser } from "../store/slices/authSlice"
import { Tooltip, Dropdown, Avatar } from "antd"
import { RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
import GoProButton from "@components/GoProButton"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const LayoutWithSidebarAndHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const user = useSelector(selectUser)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        await dispatch(loadAuthenticatedUser()).unwrap()
      } catch (err) {
        console.error("User load failed:", err)
        navigate("/login")
      }
    }

    fetchCurrentUser()

    const interval = setInterval(() => {
      fetchCurrentUser()
    }, 180000)

    return () => clearInterval(interval)
  }, [dispatch, navigate])

  useEffect(() => {
    if (user?.name || user?.credits) {
      setIsUserLoaded(true)
    }
  }, [user])

  const Menus = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "My Projects", icon: FileText, path: "/blogs" },
    { title: "Search Console", icon: TrendingUp, path: "/search-console" },
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
    rootClassName: "!px-4 !py-2 rounded-lg shadow-md w-[20ch] text-lg !bg-gray-50 gap-4",
    items: [
      {
        key: "name",
        label: (
          <Tooltip
            title={user?.name}
            className="block font-medium text-gray-900 text-center text-lg whitespace-nowrap w-full overflow-hidden text-ellipsis"
          >
            {user?.name}
          </Tooltip>
        ),
        disabled: true,
      },
      { type: "divider" },
      { key: "profile", label: "Profile", className: "!py-1.5 hover:bg-gray-100" },
      { key: "transactions", label: "Transactions", className: "!py-1.5 hover:bg-gray-100" },
      { key: "credit-logs", label: "Credit Logs", className: "!py-1.5 hover:bg-gray-100" },
      { key: "upgrade", label: "Upgrade", className: "!py-1.5 hover:bg-gray-100" },
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

  const handleUpgradePopup = (fromContentAgent = false) => {
    handlePopup({
      title: "Upgrade Required",
      description: (
        <>
          <span>Search Console is only available for Pro and Enterprise users.</span>
          <br />
          <span>Upgrade your plan to unlock this feature.</span>
        </>
      ),
      confirmText: "Buy Now",
      cancelText: "Cancel",
      onConfirm: () => navigate("/upgrade"),
      onCancel: () => {
        if (fromContentAgent) {
          navigate(-1) // Navigate back to the previous page
        }
      },
    })
  }

  const handleSearchConsoleClick = (e, path) => {
    const allowedPlans = ["pro", "enterprise"]
    const isPro =
      allowedPlans.includes(user?.plan) || allowedPlans.includes(user?.subscription?.plan)

    if (!isPro) {
      e.preventDefault() // Prevent navigation to /jobs
      handleUpgradePopup(true) // Show popup with back navigation on cancel
    } else {
      navigate(path) // Navigate to /jobs for Pro users
    }
  }

  return (
    <div className={`${path.includes("signup") || path.includes("login") ? "hidden" : "flex"}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 bg-[#3F51B5] from-purple-800 to-blue-600 text-white overflow-hidden p-2 flex flex-col ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
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
              onClick={() => navigate("/upgrade")}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group capitalize"
            >
              {user?.plan === "pro" ? (
                <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              ) : (
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              )}
              <span>{user?.plan || user?.subscription?.plan} Plan</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <ul className="space-y-3">
          {Menus.map((Menu, index) => {
            const isActive = location.pathname.startsWith(Menu.path)
            const Icon = Menu.icon
            const isSearchConsole = Menu.title === "Search Console"
            const allowedPlans = ["pro", "enterprise"]
            const isPro =
              allowedPlans.includes(user?.plan) || allowedPlans.includes(user?.subscription?.plan)

            return (
              <li key={index} className="flex items-center gap-2">
                <NavLink
                  to={Menu.path}
                  onClick={(e) => {
                    if (isSearchConsole) {
                      handleSearchConsoleClick(e, Menu.path)
                    }
                  }}
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
                {isSearchConsole && !isPro && sidebarOpen && (
                  <Tooltip title="Upgrade to Pro to access Content Agent">
                    <button
                      onClick={() => handleUpgradePopup(false)}
                      className="p-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md transition-all duration-200 hover:scale-105"
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}
              </li>
            )
          })}
        </ul>

        {/* Contact Us - Stick to bottom */}
        <div className="mt-auto px-2 pt-4">
          <NavLink
            to="/contact"
            className={`flex items-center ${
              sidebarOpen ? "justify-start gap-3 px-3 py-2" : "justify-center py-3"
            } rounded-md text-white hover:bg-white/10 transition-all duration-300`}
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
      <div className="flex-1 ml-16 fixed z-30 w-[calc(100%-4rem)]">
        <header className="top-0 z-[9999] bg-gray-50 p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img src="/Images/logo_genwrite_2.png" loading="lazy" alt="Logo" className="w-36" />
          </div>
          <div className="flex items-center space-x-4">
            <GoProButton onClick={() => navigate("/upgrade")} />
            {isUserLoaded ? (
              <>
                <Tooltip title="User Credits">
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
                <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
                  <Avatar
                    className="bg-gradient-to-tr from-blue-400 to-purple-700 text-white font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-500 transition"
                    style={{ marginLeft: "25px", marginRight: "20px" }}
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

export default LayoutWithSidebarAndHeader

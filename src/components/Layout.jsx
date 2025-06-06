import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { FaSearch, FaBell, FaCog } from "react-icons/fa"
import { RxAvatar } from "react-icons/rx"
import { logoutUser } from "../store/slices/authSlice"
import { motion, AnimatePresence } from "framer-motion"
import { FaHourglassHalf, FaCheck, FaTimes } from "react-icons/fa"
import { Badge, Tooltip } from "antd"
import { RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
const LayoutWithSidebarAndHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const location = useLocation()
  const { user } = useSelector((selector) => selector.auth)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300 },
    },
    exit: { opacity: 0, x: -20 },
    hover: {
      y: -2,
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
    tap: { scale: 0.98 },
  }

  // Modern color palette
  const typeStyles = {
    generating: {
      bg: "bg-amber-50/80",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "⏳", // Hourglass icon
    },
    completed: {
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: "✅", // Checkmark icon
    },
    error: {
      bg: "bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: "⚠️", // Warning icon
    },
  }

  useEffect(() => {
    if (user?.name) {
      setIsUserLoaded(true)
    }
  }, [user])

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const Menus = [
    { title: "Dashboard", src: "dashicon.svg", path: "/dash" },
    { title: "My Projects", src: "myprojecticon.svg", path: "/project" },
    { title: "Toolbox", src: "toolboxicon.png", path: "/toolbox" },
    { title: "Plugins", src: "pluginicon.svg", path: "/plugins" },
    { title: "Brand Voice", src: "brandvoiceicon.svg", path: "/brandvoice" },
    { title: "TrashCan", src: "trashcan.png", path: "/trashcan" },
    { title: "Jobs", src: "jobsicon.svg", path: "/jobs" },
    { title: "Upgrade", src: "upgrade.svg", path: "/upgrade" },
  ]

  const path = location.pathname

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen)
  }

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen)
  }
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(navigate))
      setSettingsOpen(false)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className={`${path.includes("signup") || path.includes("login") ? "hidden" : "flex"}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${
          sidebarOpen ? "w-64 z-40 text-2xl transition-all ease-linear" : "w-20 z-40"
        } bg-[#180E3C] text-black p-5 pt-8 transition-width duration-300`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="flex gap-x-4 items-center text-black">
          <img
            src="/Images/logo_genwrite.png"
            width={"50%"}
            height={"50%"}
            loading="lazy"
            className={`cursor-pointer transition-transform duration-700 ease-in-out ${
              sidebarOpen ? "" : "w-full"
            }`}
            alt="Logo"
          />
        </div>
        <ul className="pt-6">
          {Menus.map((Menu, index) => (
            <li key={index} className={`mt-4 ${Menu.gap ? "mt-12" : ""}`}>
              <NavLink
                to={Menu.path}
                className={({ isActive }) =>
                  `flex rounded-md p-2 cursor-pointer hover:bg-light-white text-gray-300 text-sm items-center gap-x-4 ${
                    isActive || location.pathname.startsWith(Menu.path)
                      ? "shadow-[rgba(0,_0,_0,_0.4)_0px_30px_90px] bg-gray-800 text-black"
                      : ""
                  }`
                }
              >
                <img src={`/Images/${Menu.src}`} alt={Menu.title} />
                <span
                  className={`${
                    !sidebarOpen && "hidden"
                  } origin-left transition-opacity duration-500 ease-in-out`}
                >
                  {Menu.title}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User Profile Section */}
        <div className="absolute bottom-0 w-full p-4">
          <NavLink
            to="/profile"
            className="flex items-center py-3  w-full text-gray-300 hover:text-white transition duration-150"
          >
            <img
              src="/Images/usericon.svg"
              alt="User Profile"
              className={`${!sidebarOpen ? "w-8 ml-1 h-8 relative -left-5" : ""}`}
            />
            <span
              className={`${
                !sidebarOpen && "hidden"
              } ml-3 text-lg font-medium origin-left transition-opacity duration-500 ease-in-out`}
            >
              {user?.name?.split(" ")[0] || "UserName"}
            </span>
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-20 w-[93vw] fixed z-30">
        {/* Header */}
        <header className="top-0 z-[9999] bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button className="lg:hidden mr-4">{/* Button content */}</button>
            <div className="flex items-center bg-white rounded-full overflow-hidden w-64 lg:w-96 shadow-md hover:shadow-lg transition-shadow duration-300">
              <FaSearch className="w-5 h-5 text-gray-500 mx-3" />
              <input
                className="w-full bg-white px-4 py-2 text-gray-700 focus:outline-none"
                type="text"
                placeholder="Search"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-700 rounded-full transition duration-200 flex items-center gap-2">
              {isUserLoaded && user?.name ? (
                <>
                  <Tooltip
                    title="User Credits"
                    className="flex gap-2 justify-center items-center mr-4 rounded-full p-2 hover:bg-gray-100"
                  >
                    <RiCoinsFill size={30} color="orange" />
                    <span className="font-semibold text-lg">
                      {user.credits.base + user.credits.extra}
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={`Hello ${user.name}`}
                    className="size-10 bg-gradient-to-tr from-blue-400 to-purple-700 text-white rounded-full hover:bg-gray-100 text-xl p-2"
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </Tooltip>
                </>
              ) : (
                <>
                  <RxAvatar size={30} />
                  <span className="text-[#2E2E2E] text-[16px] font-[400]">UserName</span>
                </>
              )}
            </button>
            <div className="relative">
              {/* <button
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150"
                onClick={toggleNotifications}
              >
                <FaBell className="w-6 h-6" />
              </button> */}
              <NotificationDropdown notifications={user.notifications} />
            </div>
            <div className="relative">
              <button
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150"
                onClick={toggleSettings}
              >
                <FaCog className="w-6 h-6" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10">
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
    </div>
  )
}

export default LayoutWithSidebarAndHeader

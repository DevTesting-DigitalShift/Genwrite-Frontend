import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { FaSearch, FaCog } from "react-icons/fa"
import { IoIosLogOut } from "react-icons/io"
import { RxAvatar } from "react-icons/rx"
import { logoutUser } from "../store/slices/authSlice"
import { motion, AnimatePresence } from "framer-motion"
import { FaHourglassHalf, FaCheck, FaTimes } from "react-icons/fa"
import { Badge, Tooltip, Switch, Dropdown, Avatar, Menu } from "antd"
import { CrownFilled } from "@ant-design/icons"
import { RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
import GoProButton from "@components/GoProButton"

const LayoutWithSidebarAndHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((selector) => selector.auth)

  useEffect(() => {
    if (user?.name) {
      setIsUserLoaded(true)
    }
  }, [user])

  const Menus = [
    { title: "Dashboard", src: "dashicon.svg", path: "/dash" },
    { title: "My Projects", src: "myprojecticon.svg", path: "/project" },
    { title: "Toolbox", src: "toolboxicon.png", path: "/toolbox" },
    { title: "Integrations", src: "pluginicon.svg", path: "/integrations" },
    { title: "Brand Voice", src: "brandvoiceicon.svg", path: "/brandvoice" },
    { title: "TrashCan", src: "trashcan.png", path: "/trashcan" },
    { title: "Jobs", src: "jobsicon.svg", path: "/jobs" },
  ]

  const path = location.pathname

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(navigate))
    } catch (error) {
      console.log(error)
    }
  }

  /** @type {import("antd").MenuProps} */
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
          <Tooltip title={user?.name} className="block font-medium text-gray-900 text-center text-lg whitespace-nowrap w-full overflow-hidden text-ellipsis">
            {user?.name}
          </Tooltip>
        ),
        disabled: true, // Show name but non-clickable
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
        <div className="h-10 flex gap-x-4 items-center text-black mb-4 overflow-clip">
          <img
            src="/Images/logo_genwrite_1.png"
            loading="lazy"
            className={`cursor-pointer transition-transform duration-700 ease-in-out ${
              sidebarOpen ? "" : "object-contain min-w-[90px] -ml-2.5"
            }`}
            alt="Logo"
          />
        </div>
        <style>
          {`
            .custom-blue-switch .ant-switch {
              background-color: #e5e7eb !important; /* Tailwind gray-200 */
              box-shadow: 0 0 0 2px #fff !important;
              border: none !important;
            }
            .custom-blue-switch .ant-switch-checked {
              background-color: #fff !important;
              box-shadow: 0 0 0 2px #fff !important;
              border: none !important;
            }
            .custom-blue-switch .ant-switch-handle {
              background: #fff !important;
              border-radius: 50% !important;
              box-shadow: 0 0 2px #0002;
            }
            .custom-blue-switch .ant-switch-checked .ant-switch-handle {
              background: #fff !important;
              border-radius: 50% !important;
            }
          `}
        </style>
        <ul className="pt-1">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-20 w-[93vw] fixed z-30">
        <header className="top-0 z-[9999] bg-gray-50 p-8 flex items-center justify-between">
          {/* Left side: search */}
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

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <GoProButton onClick={() => navigate("/upgrade")} />

            {/* Credits */}
            {isUserLoaded && user?.name ? (
              <>
                <Tooltip title="User Credits">
                  <button
                    onClick={() => navigate("/upgrade")}
                    className="flex gap-2 justify-center items-center mr-4 rounded-full p-2 hover:bg-gray-100 transition"
                  >
                    <RiCoinsFill size={30} color="orange" />
                    <span className="font-semibold text-lg">
                      {user?.credits?.base + user?.credits?.extra || 0}
                    </span>
                  </button>
                </Tooltip>

                {/* Notifications */}
                <div className="relative">
                  <NotificationDropdown notifications={user?.notifications} />
                </div>
                {/* Dropdown Avatar with menu */}
                <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
                  {/* <Tooltip title={`Hello ${user.name}`} > */}
                  <Avatar
                    className="bg-gradient-to-tr from-blue-400 to-purple-700 text-white text-lg font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-500 transition"
                    size="large"
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </Avatar>
                  {/* </Tooltip> */}
                </Dropdown>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <RxAvatar size={30} />
                <span className="text-[#2E2E2E] text-[16px] font-[400]">UserName</span>
              </div>
            )}

            {/* Settings Dropdown (Animated)
            <div className="relative">
              <button
                onClick={() => navigate("/profile")}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150"
              >
                <FaCog className="w-6 h-6" />
              </button>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10"
                >
                  <button
                    className="flex px-4 py-2 text-md text-gray-700 hover:bg-gray-100 w-full text-left justify-between"
                    onClick={handleLogout}
                  >
                    <span>Logout</span> <IoIosLogOut size={20} />
                  </button>
                </motion.div>
              )}
            </div> */}
          </div>
        </header>
      </div>
    </div>
  )
}

export default LayoutWithSidebarAndHeader

import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { RxAvatar } from "react-icons/rx"
import { FiMenu } from "react-icons/fi"
import { Crown, Zap } from "lucide-react"
import { loadAuthenticatedUser, logoutUser, selectUser } from "../store/slices/authSlice"
import { Tooltip, Dropdown, Avatar } from "antd"
import { RiCoinsFill } from "react-icons/ri"
import NotificationDropdown from "@components/NotificationDropdown"
import GoProButton from "@components/GoProButton"
import { loadUser } from "../api/authApi"

const LayoutWithSidebarAndHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // const { user } = useSelector((selector) => selector.auth)
  const user = useSelector(selectUser)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await dispatch(loadAuthenticatedUser()).unwrap()
        // You now have the updated user data in Redux state
      } catch (err) {
        console.error("User load failed:", err)
        navigate("/login") // optional: redirect on failure
      }
    }

    fetchCurrentUser()
  }, [dispatch, navigate])

  // console.log({ user })

  useEffect(() => {
    if (user?.name || user?.credits) {
      setIsUserLoaded(true)
    }
  }, [user])

  const Menus = [
    { title: "Dashboard", src: "dashicon.svg", path: "/dash" },
    { title: "My Projects", src: "myprojecticon.svg", path: "/project" },
    { title: "Content Agent", src: "jobsicon.svg", path: "/jobs" },
    { title: "Toolbox", src: "toolboxicon.png", path: "/toolbox" },
    { title: "Integrations", src: "pluginicon.svg", path: "/integrations" },
    { title: "Brand Voice", src: "brandvoiceicon.svg", path: "/brandvoice" },
    { title: "TrashCan", src: "trashcan.png", path: "/trashcan" },
  ]

  const path = location.pathname

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(navigate))
      navigate("/login")
    } catch (error) {
      console.error(error)
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

  return (
    <div className={`${path.includes("signup") || path.includes("login") ? "hidden" : "flex"}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 bg-gradient-to-br from-purple-800 to-blue-600 text-white overflow-hidden p-2 ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
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

        {/* Upgrade Button - Only show when sidebar is open */}
        {sidebarOpen && (
          <div className="mb-6 px-2">
            <button
              onClick={() => navigate("/upgrade")}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span>Upgrade Plan</span>
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        )}

        <ul className="space-y-3">
          {Menus.map((Menu, index) => {
            const isActive = location.pathname.startsWith(Menu.path)
            return (
              <li key={index}>
                <NavLink
                  to={Menu.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 text-white hover:bg-white/10 ${
                    isActive ? "bg-white/20 font-semibold" : ""
                  }`}
                >
                  <img
                    src={`/Images/${Menu.src}`}
                    alt={Menu.title}
                    className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-60"}`}
                  />
                  <span className={`${!sidebarOpen ? "hidden" : "block"}`}>{Menu.title}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
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
                    onClick={() => navigate("/upgrade")}
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

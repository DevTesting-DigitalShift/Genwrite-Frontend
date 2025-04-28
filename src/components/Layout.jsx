import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSearch, FaBell, FaCog } from "react-icons/fa";
import { RxAvatar } from "react-icons/rx";
import { logoutUser } from "../store/slices/authSlice";

const LayoutWithSidebarAndHeader = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((selector) => selector.auth);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setIsUserLoaded(true);
    }
  }, [user]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const Menus = [
    { title: "Dashboard", src: "dashicon.svg", path: "/dash" },
    { title: "My Projects", src: "myprojecticon.svg", path: "/project" },
    { title: "Toolbox", src: "toolboxicon.png", path: "/toolbox" },
    { title: "Plugins", src: "pluginicon.svg", path: "/plugins" },
    { title: "Brand Voice", src: "brandvoiceicon.svg", path: "/brandvoice" },
    { title: "TrashCan", src: "trashcan.png", path: "/trashcan" },
  ];

  const path = location.pathname;

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(navigate));
      setSettingsOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`${
        path.includes("signup") || path.includes("login") ? "hidden" : "flex"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${
          sidebarOpen
            ? "w-64 z-40 text-2xl transition-all ease-linear"
            : "w-20 z-40"
        } bg-[#180E3C] text-black p-5 pt-8 transition-width duration-300`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="flex gap-x-4 items-center text-black">
          <img
            src="/Images/logo_genwrite.svg"
            className={`cursor-pointer transition-transform duration-700 ease-in-out ${
              sidebarOpen && ""
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
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-20 w-[93vw] fixed">
        {/* Header */}
        <header className="top-0 z-[9999]  bg-gray-50 p-4 flex items-center justify-between">
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
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150 flex items-center gap-2">
              {isUserLoaded && user?.name ? (
                <>
                  <div className="w-9 h-9 text-white font-bold rounded-full bg-primary flex justify-center items-center">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[#2E2E2E] text-[16px] font-[400]">
                   Hello {user.name}!
                  </span>
                </>
              ) : (
                <>
                  <RxAvatar size={30} />
                  <span className="text-[#2E2E2E] text-[16px] font-[400]">
                    UserName 
                  </span>
                </>
              )}
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150">
              <FaBell className="w-6 h-6" />
            </button>
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
  );
};

export default LayoutWithSidebarAndHeader;

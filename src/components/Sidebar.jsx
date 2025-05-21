import React, { useState, useEffect } from "react";
import { FaSearch, FaBars } from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
import { RxAvatar } from "react-icons/rx";
import QuestionButton from "../utils/QuestionButton";

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true); // Sidebar is open on larger screens
        setIsMobileMenuOpen(false); // Close mobile menu
      } else {
        setIsSidebarOpen(false); // Sidebar is closed on smaller screens
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const NavItem = ({ icon, text, to }) => (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center py-3 px-4 w-full text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 ${
            isActive ? "bg-gray-700 text-white" : ""
          }`
        }
        onClick={() => {
          if (window.innerWidth < 1024) {
            // Close menu on mobile devices
            setIsMobileMenuOpen(false);
          }
        }}
      >
        {icon}
        <span className="ml-3">{text}</span>
      </NavLink>
    </li>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#180E3C] text-white w-64 min-h-screen fixed lg:static transition-all duration-300 ease-in-out z-20 ${
          isSidebarOpen || isMobileMenuOpen ? "left-0" : "-left-64"
        } lg:left-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <img
            src="./Images/logo_genwrite.svg"
            alt="GenWrite Logo"
            className="h-8"
          />
        </div>

        {/* Navigation Section */}
        <nav className="mt-6">
          <ul className="space-y-2">
            <NavItem
              icon={<img src="./Images/dashicon.svg" alt="dashboard" />}
              text="Dashboard"
              to="/"
            />
            <NavItem
              icon={<img src="./Images/myprojecticon.svg" alt="projects" />}
              text="My Projects"
              to="/project"
            />
            <NavItem
              icon={<img src="./Images/toolboxicon.png" alt="toolbox" />}
              text="Toolbox"
              to="/toolbox"
            />
            <NavItem
              icon={<img src="./Images/pluginicon.svg" alt="plugins" />}
              text="Plugins"
              to="/plugins"
            />
            <NavItem
              icon={<img src="./Images/brandvoiceicon.svg" alt="brand-voice" />}
              text="Brand Voice"
              to="/brandvoice"
            />
            <NavItem
              icon={<img src="./Images/trashcan.png" alt="trash" />}
              text="Trashcan"
              to="/trashcan"
            />
            {/* Jobs Section */}
            <NavItem
              icon={<img src="./Images/jobsicon.svg" alt="jobs" />}
              text="Jobs"
              to="/jobs"
            />
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 w-full bg-gray-900 p-4">
          <NavLink
            to="/profile"
            className="flex items-center py-3 px-4 w-full text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150"
          >
            <img src="./Images/usericon.svg" alt="user profile" />
            <span className="ml-3">User Profile</span>
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden mr-4"
            >
              <FaBars className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center bg-white rounded-full overflow-hidden w-64 lg:w-96">
              <FaSearch className="w-5 h-5 text-gray-500 mx-3" />
              <input
                className="w-full px-4 py-2 text-gray-700 focus:outline-none bg-transparent"
                type="text"
                placeholder="Search"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150 flex items-center gap-2">
              <RxAvatar size={30} />
              <span className="text-[#2E2E2E] text-[16px] font-[400]">
                Username
              </span>
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150">
              <img src="./Images/notificationicon.png" alt="notification" />
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition duration-150">
              <img src="./Images/settingicon.png" alt="setting" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <QuestionButton />
    </div>
  );
};

export default Sidebar;

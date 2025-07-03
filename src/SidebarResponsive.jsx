import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const SidebarResponsive = () => {
  const [open, setOpen] = useState(false); // Start with the sidebar closed
  const location = useLocation();

  const Menus = [
    { title: "Dashboard", src: "dashicon.svg", path: "/dashboard" },
    { title: "My Projects", src: "myprojecticon.svg", path: "/blogs" },
    { title: "Toolbox", src: "toolboxicon.png", path: "/toolbox" },
    { title: "Plugins", src: "pluginicon.svg", path: "/plugins" },
    { title: "Brand Voice", src: "brandvoiceicon.svg", path: "/brand-voice" },
    { title: "TrashCan", src: "trashcan.png", path: "/trashcan" },
  ];

  return (
    <div
      className={`fixed top-0 h-[100vh] ${
        open ? "w-64 z-999 text-2xl transition-all ease-linear" : "z-999 w-20"
      } bg-[#180E3C] text-black p-5 pt-8 `}
      onMouseEnter={() => setOpen(true)} // Open the sidebar on hover
      onMouseLeave={() => setOpen(false)} // Close the sidebar when not hovering
    >
      <div className="flex gap-x-4 items-center text-black">
        <img
          src="/Images/logo_genwrite.svg"
          className={`cursor-pointer transition-transform duration-700 ease-in-out ${
            open && ""
          }`}
        />
      </div>
      <ul className="pt-6">
        {Menus.map((Menu, index) => (
          <li key={index} className={`mt-4 ${Menu.gap ? "mt-12" : ""}`}>
            <NavLink
              to={Menu.path}
              className={({ isActive }) =>
                `flex rounded-md p-2 cursor-pointer hover:bg-light-white text-gray-300 text-sm items-center gap-x-4 ${
                  isActive || location.pathname.startsWith(Menu.path) ? "shadow-[rgba(0,_0,_0,_0.4)_0px_30px_90px] bg-gray-800 text-black" : ""
                }`
              }
            >
              <img src={`/Images/${Menu.src}`} alt={Menu.title} />
              <span
                className={`${
                  !open && "hidden"
                } origin-left transition-opacity duration-500 ease-in-out`}
              >
                {Menu.title}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarResponsive;

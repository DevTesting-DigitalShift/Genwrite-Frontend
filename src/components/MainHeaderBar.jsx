import React from 'react';
import { FaSearch } from "react-icons/fa";
import { RxAvatar } from "react-icons/rx";

const MainHeaderBar = () => {
  return (
    <header className="fixed top-0 left-20 right-0 z-30 bg-gray-50 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button className="lg:hidden mr-4">
          {/* Button content */}
        </button>
        <div className="flex items-center bg-white rounded-full overflow-hidden w-64 lg:w-96">
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
  );
}

export default MainHeaderBar;

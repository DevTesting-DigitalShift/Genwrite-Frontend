import React from 'react';

const Header = () => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div className="flex space-x-4">
        <button className="text-lg font-semibold">How to Cook Pasta in...</button>
        <button className="px-4 py-2 bg-[#1B71CC] text-white rounded-md">Create New</button>
      </div>
    </div>
  );
};

export default Header;

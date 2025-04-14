import React from "react";

const Modal = ({ title, visible, onCancel, children }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-overlay absolute inset-0 bg-gray-800 opacity-50"></div>
      <div className="modal-container bgwhi w-96 rounded-lg shadow-lg z-50 overflow-y-auto">
        <div className="modal-header p-4 border-b">
          <h3 className="text-lg font-semibold ">{title}</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onCancel}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="modal-content p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

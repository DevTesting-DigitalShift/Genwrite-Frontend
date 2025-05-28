import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Call this to update notifications from MyProjects
  const updateNotifications = (blogs) => {
    const generating = blogs.filter((b) => b.status !== "complete" && b.status !== "failed");
    const generated = blogs.filter((b) => b.status === "complete");
    const notifList = [
      ...generating.map((b) => ({
        id: b._id,
        type: "generating",
        message: `Blog "${b.title}" is generating...`,
      })),
      ...generated.map((b) => ({
        id: b._id,
        type: "generated",
        message: `Blog "${b.title}" has been generated.`,
      })),
    ];
    setNotifications(notifList);
  };

  return (
    <NotificationContext.Provider value={{ notifications, updateNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
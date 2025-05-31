import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Call this to update notifications from MyProjects
  const updateNotifications = (blogs) => {
    const generating = blogs.filter((b) => b.status !== "complete" && b.status !== "failed");
    const generated = blogs.filter((b) => b.status === "complete");
    const restored = blogs.filter((b) => b.status === "restored");
    const notifList = [
      ...generating.map((b) => ({
        id: b._id,
        type: "generating",
        message: `Blog "${b.title}" is generating...`,
        read: false,
      })),
      ...generated.map((b) => ({
        id: b._id,
        type: "generated",
        message: `Blog "${b.title}" has been generated.`,
        read: false,
      })),
      ...restored.map((b) => ({
        id: b._id,
        type: "restored",
        message: `Blog "${b.title}" has been restored.`,
        read: false,
      })),
    ];
    setNotifications(notifList);
  };

  // Fetch notifications from backend user.notifications
  const fetchNotificationsFromBackend = async () => {
    try {
      const res = await fetch("/api/user/me", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      // Optionally handle error (e.g., toast, log)
      console.error("Error fetching notifications from backend:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Delete a notification by id
  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, updateNotifications, fetchNotificationsFromBackend, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
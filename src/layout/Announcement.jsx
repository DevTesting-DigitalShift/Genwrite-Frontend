"use client"

import React, { useState, useMemo } from "react"
import { Megaphone, X, Puzzle, Wand2, AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { message, Spin } from "antd"

// Configuration for different announcement types
const announcementConfig = {
  PLUGIN_UPDATE: {
    icon: Puzzle,
    title: "Plugin Update Available",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  NEW_FEATURE: {
    icon: Wand2,
    title: "New Feature Unlocked",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  IMPORTANT_NOTICE: {
    icon: AlertTriangle,
    title: "Important Notice",
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  DEFAULT: {
    icon: Megaphone,
    title: "Announcement",
    iconColor: "text-gray-600",
    bgColor: "bg-gray-100",
  },
}

// Fetch data from the API
const fetchAnnouncements = async () => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/data.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch announcements: ${response.statusText}`)
  }
  const data = await response.json()
  return data
}

// Announcement Modal Component
const AnnouncementModal = ({ announcement, onClose }) => {
  // Get the display configuration for the current announcement type, or use default
  const config = useMemo(
    () => announcementConfig[announcement.type] || announcementConfig.DEFAULT,
    [announcement.type]
  )
  const IconComponent = config.icon

  // Format the date for better readability
  const formattedDate = useMemo(() => {
    return new Date(announcement.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [announcement.date])

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 animate-fadeIn">
      {/* Modal Panel */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform animate-scaleIn transition-transform duration-300">
        <div className="p-6 text-center">
          <div
            className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${config.bgColor} mb-5`}
          >
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-500 mt-2 mb-4">{formattedDate}</p>
          <p className="text-md text-gray-700 leading-relaxed">{announcement.message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors duration-200"
            onClick={onClose}
            aria-label="Close announcement modal"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Main Component to Trigger the Modal
export default function AnnouncementsUI() {
  // Fetch announcements using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // Garbage collect after 24 hours
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    onError: (error) => {
      console.error("Failed to fetch announcements:", error)
      message.error("Failed to load announcements. Please try again later.")
    },
  })

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Set modal visibility based on fetched data
  useMemo(() => {
    if (data?.announcements?.length > 0) {
      setIsModalOpen(true)
    }
  }, [data])

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Spin size="large" />
      </div>
    )
  }

  // Handle error state
  if (error) {
    return null // Silently fail to avoid disrupting user experience
  }

  // Get the first announcement to show
  const announcementToShow = data?.announcements?.[0]

  // Don't render anything if there's no announcement or modal is closed
  if (!isModalOpen || !announcementToShow) {
    return null
  }

  return <AnnouncementModal announcement={announcementToShow} onClose={handleCloseModal} />
}

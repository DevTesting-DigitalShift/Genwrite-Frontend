import React, { useState, useMemo } from "react"
import { X, Megaphone, Puzzle, Wand2, AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { message } from "antd"

// Configuration for different announcement types
const announcementConfig = {
  PLUGIN_UPDATE: {
    icon: Puzzle,
    title: "Plugin Update Available",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    bannerBg: "bg-blue-50",
    borderColor: "border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  NEW_FEATURE: {
    icon: Wand2,
    title: "New Feature Unlocked",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    bannerBg: "bg-indigo-50",
    borderColor: "border-indigo-200",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
  },
  IMPORTANT_NOTICE: {
    icon: AlertTriangle,
    title: "Important Notice",
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    bannerBg: "bg-amber-50",
    borderColor: "border-amber-200",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
  },
  DEFAULT: {
    icon: Megaphone,
    title: "Announcement",
    iconColor: "text-gray-600",
    bgColor: "bg-gray-100",
    bannerBg: "bg-gray-50",
    borderColor: "border-gray-200",
    buttonColor: "bg-gray-600 hover:bg-gray-700",
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

// Inline Announcement Banner Component
const InlineAnnouncementBanner = ({ onClose }) => {
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

  // Get the display configuration for the current announcement type, or use default
  const announcement = data?.announcements?.[0]
  const config = useMemo(
    () => announcement ? (announcementConfig[announcement.type] || announcementConfig.DEFAULT) : null,
    [announcement]
  )

  const IconComponent = config?.icon

  // Format the date for better readability
  const formattedDate = useMemo(() => {
    if (!announcement?.date) return ""
    return new Date(announcement.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [announcement?.date])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-3 h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  // Handle error state
  if (error || !announcement) {
    return null // Silently fail to avoid disrupting user experience
  }

  return (
    <div className={`${config.bannerBg} border ${config.borderColor} rounded-lg p-4 mb-6 relative`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${config.bgColor} flex-shrink-0`}
          >
            {IconComponent && <IconComponent className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">{config.title}</h3>
              {formattedDate && (
                <span className="text-xs text-gray-500">{formattedDate}</span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{announcement.message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default InlineAnnouncementBanner
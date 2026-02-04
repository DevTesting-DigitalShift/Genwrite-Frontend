import React, { useState, useEffect } from "react"
import { Modal, Input, Tabs, message, Button, Select } from "antd"
import {
  Youtube,
  Globe,
  Link as LinkIcon,
  Edit3,
  Trash2,
  Check,
  X,
  ExternalLink,
  Play,
  Film,
} from "lucide-react"

const { TextArea } = Input
const { Option } = Select

// YouTube URL validation and embed URL extraction
const validateYouTubeUrl = url => {
  if (!url) return { valid: false, embedUrl: null, videoId: null }

  // Check if it's already an embed URL
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) {
    return {
      valid: true,
      embedUrl: url,
      videoId: embedMatch[1],
      type: "embed",
    }
  }

  // Standard YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        valid: true,
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        videoId: match[1],
        type: "video",
      }
    }
  }

  return { valid: false, embedUrl: null, videoId: null }
}

// Website URL validation
const validateWebsiteUrl = url => {
  if (!url) return false
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// Embed Card Component
export const EmbedCard = ({ embed, onEdit, onDelete, editable = true }) => {
  const [isHovered, setIsHovered] = useState(false)

  if (embed.type === "youtube") {
    return (
      <div
        className="relative group my-4 rounded-xl overflow-hidden shadow-sm border border-gray-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* YouTube iframe */}
        <div className="aspect-video bg-black">
          <iframe
            src={embed.embedUrl}
            title={embed.title || "YouTube video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Info bar */}
        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Youtube className="w-4 h-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-gray-800 truncate text-sm">
                  {embed.title || "Untitled Video"}
                </h4>
              </div>
            </div>

            {/* Action buttons */}
            {editable && (
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={() => onEdit?.(embed)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => onDelete?.(embed)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Website link embed
  return (
    <div
      className="relative group my-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-800 truncate">{embed.title || embed.url}</h4>
            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{embed.url}</span>
            </div>
          </div>
        </div>
      </a>

      {/* Action buttons */}
      {editable && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onEdit?.(embed)
            }}
            className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onDelete?.(embed)
            }}
            className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  )
}

// Add Embed Modal Component
export const AddEmbedModal = ({ open, onClose, onAdd, editingEmbed = null }) => {
  const [activeTab, setActiveTab] = useState("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeTitle, setYoutubeTitle] = useState("")
  const [youtubeError, setYoutubeError] = useState("")
  const [youtubePreview, setYoutubePreview] = useState(null)

  const [websiteUrl, setWebsiteUrl] = useState("")
  const [websiteTitle, setWebsiteTitle] = useState("")
  const [websiteError, setWebsiteError] = useState("")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (editingEmbed) {
        if (editingEmbed.type === "youtube") {
          setActiveTab("youtube")
          setYoutubeUrl(editingEmbed.originalUrl || editingEmbed.embedUrl || "")
          setYoutubeTitle(editingEmbed.title || "")
        } else {
          setActiveTab("website")
          setWebsiteUrl(editingEmbed.url || "")
          setWebsiteTitle(editingEmbed.title || "")
        }
      } else {
        setYoutubeUrl("")
        setYoutubeTitle("")
        setYoutubeError("")
        setYoutubePreview(null)
        setWebsiteUrl("")
        setWebsiteTitle("")
        setWebsiteError("")
      }
    }
  }, [open, editingEmbed])

  // Validate YouTube URL on change
  useEffect(() => {
    if (youtubeUrl) {
      const result = validateYouTubeUrl(youtubeUrl)
      if (result.valid) {
        setYoutubeError("")
        setYoutubePreview(result)
      } else {
        setYoutubeError("Please enter a valid YouTube URL or embed link")
        setYoutubePreview(null)
      }
    } else {
      setYoutubeError("")
      setYoutubePreview(null)
    }
  }, [youtubeUrl])

  // Validate website URL on change
  useEffect(() => {
    if (websiteUrl) {
      if (validateWebsiteUrl(websiteUrl)) {
        setWebsiteError("")
      } else {
        setWebsiteError("Please enter a valid website URL")
      }
    } else {
      setWebsiteError("")
    }
  }, [websiteUrl])

  const handleAddYouTube = () => {
    if (!youtubeUrl) {
      setYoutubeError("Please enter a YouTube URL")
      return
    }

    const result = validateYouTubeUrl(youtubeUrl)
    if (!result.valid) {
      setYoutubeError("Please enter a valid YouTube URL or embed link")
      return
    }

    if (!youtubeTitle.trim()) {
      message.warning("Please add a title for SEO")
      return
    }

    onAdd({
      id: editingEmbed?.id || `embed-${Date.now()}`,
      type: "youtube",
      embedUrl: result.embedUrl,
      originalUrl: youtubeUrl,
      videoId: result.videoId,
      title: youtubeTitle.trim(),
    })

    onClose()
  }

  const handleAddWebsite = () => {
    if (!websiteUrl) {
      setWebsiteError("Please enter a website URL")
      return
    }

    if (!validateWebsiteUrl(websiteUrl)) {
      setWebsiteError("Please enter a valid website URL")
      return
    }

    if (!websiteTitle.trim()) {
      message.warning("Please add a title for SEO")
      return
    }

    let url = websiteUrl
    if (!url.startsWith("http")) {
      url = `https://${url}`
    }

    onAdd({
      id: editingEmbed?.id || `embed-${Date.now()}`,
      type: "website",
      url,
      title: websiteTitle.trim(),
    })

    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-600" />
          <span>{editingEmbed ? "Edit Embed" : "Add Embed"}</span>
        </div>
      }
      footer={null}
      width={560}
      centered
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "youtube",
            label: (
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                YouTube Video
              </div>
            ),
            children: (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube URL or Embed Link <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or embed URL"
                    status={youtubeError ? "error" : ""}
                  />
                  {youtubeError && <p className="text-xs text-red-500 mt-1">{youtubeError}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: youtube.com/watch, youtu.be, youtube.com/embed
                  </p>
                </div>

                {/* Preview */}
                {youtubePreview && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-900">
                      <iframe
                        src={youtubePreview.embedUrl}
                        title="Preview"
                        frameBorder="0"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={youtubeTitle}
                    onChange={e => setYoutubeTitle(e.target.value)}
                    placeholder="Video title for SEO and accessibility"
                  />
                </div>

                <Button
                  type="primary"
                  onClick={handleAddYouTube}
                  disabled={!youtubePreview || !youtubeTitle.trim()}
                  className="w-full !bg-red-600 !hover:bg-red-700"
                  icon={<Youtube className="w-4 h-4" />}
                >
                  {editingEmbed ? "Update YouTube Video" : "Add YouTube Video"}
                </Button>
              </div>
            ),
          },
          {
            key: "website",
            label: (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website Link
              </div>
            ),
            children: (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    status={websiteError ? "error" : ""}
                    prefix={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  {websiteError && <p className="text-xs text-red-500 mt-1">{websiteError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={websiteTitle}
                    onChange={e => setWebsiteTitle(e.target.value)}
                    placeholder="Link title for SEO and accessibility"
                  />
                </div>

                <Button
                  type="primary"
                  onClick={handleAddWebsite}
                  disabled={!websiteUrl || websiteError || !websiteTitle.trim()}
                  className="w-full"
                  icon={<LinkIcon className="w-4 h-4" />}
                >
                  {editingEmbed ? "Update Website Link" : "Add Website Link"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  )
}

// Parse iframes from HTML content
export const parseEmbedsFromHtml = html => {
  if (!html) return []

  const embeds = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  // Find all iframes
  const iframes = doc.querySelectorAll("iframe")
  iframes.forEach((iframe, index) => {
    const src = iframe.getAttribute("src") || ""
    const title = iframe.getAttribute("title") || ""

    // Check if it's a YouTube embed
    const ytResult = validateYouTubeUrl(src)
    if (ytResult.valid) {
      embeds.push({
        id: `embed-yt-${index}-${Date.now()}`,
        type: "youtube",
        embedUrl: ytResult.embedUrl,
        originalUrl: src,
        videoId: ytResult.videoId,
        title: title || "YouTube Video",
        element: iframe.outerHTML,
      })
    }
  })

  return embeds
}

// Convert embed to HTML for storage
export const embedToHtml = embed => {
  if (embed.type === "youtube") {
    return `<div class="embed-container youtube-embed" data-embed-id="${embed.id}">
      <iframe 
        src="${embed.embedUrl}" 
        title="${embed.title || ""}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        class="w-full aspect-video"
      ></iframe>
    </div>`
  }

  if (embed.type === "website") {
    return `<div class="embed-container website-embed" data-embed-id="${embed.id}">
      <a href="${embed.url}" target="_blank" rel="noopener noreferrer" title="${embed.title || ""}">
        ${embed.title || embed.url}
      </a>
    </div>`
  }

  return ""
}

export default {
  EmbedCard,
  AddEmbedModal,
  parseEmbedsFromHtml,
  embedToHtml,
  validateYouTubeUrl,
  validateWebsiteUrl,
}

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { getSocket } from "@utils/socket"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"

/** Assets already announced this session — the fal webhook and a manual refresh can race
 * and both emit "media:statusChanged" for the same terminal state. */
const notifiedIds = new Set<string>()

/**
 * App-wide listener for Media Studio's "media:created"/"media:statusChanged" socket events
 * (emitted by the backend when a generation is submitted and when fal's webhook — or a
 * manual refresh — resolves it). Keeps the media cache fresh and tells the user when a
 * generation finishes, wherever they are in the app, since videos can take several minutes.
 * Mounted once in the private layout (SideBar_Header), not on the Media page itself.
 */
export function useMediaNotifications() {
  const navigate = useNavigate()

  useEffect(() => {
    let socket = getSocket()
    let retryCount = 0
    let retryTimeout: ReturnType<typeof setTimeout> | undefined

    const handleCreated = (asset: MediaAsset) => mediaQuery.applyAssetUpdate(asset)

    const handleStatusChanged = (asset: MediaAsset) => {
      mediaQuery.applyAssetUpdate(asset)
      if (asset.status !== "completed" && asset.status !== "failed") return
      if (notifiedIds.has(asset._id)) return
      notifiedIds.add(asset._id)

      const label = asset.type === "image" ? "Image" : "Video"
      if (asset.status === "completed") {
        toast.success(`${label} ready in Media Studio`, {
          action: { label: "View", onClick: () => navigate("/media") },
        })
      } else {
        toast.error(`${label} generation failed — credits refunded`, {
          description: asset.errorMessage || undefined,
        })
      }
    }

    // Same wait-for-socket retry as SideBar_Header's listeners — the socket connects after auth.
    const setupListeners = () => {
      socket = socket ?? getSocket()
      if (!socket) {
        if (retryCount++ < 10) retryTimeout = setTimeout(setupListeners, 500)
        return
      }
      socket.on("media:created", handleCreated)
      socket.on("media:statusChanged", handleStatusChanged)
    }
    setupListeners()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      socket?.off("media:created", handleCreated)
      socket?.off("media:statusChanged", handleStatusChanged)
    }
  }, [navigate])
}

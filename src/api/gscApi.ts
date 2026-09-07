import { asApiError } from "@/types/api"
import axiosInstance from "."

export const getVerifiedSites = async () => {
  try {
    const response = await axiosInstance.get("/gsc/data")
    return response.data || []
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch verified sites")
  }
}

export const getGscAnalytics = async (params: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get("/gsc/data", { params })
    return response.data // Backend returns array of objects directly
  } catch (rawError) {
    const error = asApiError(rawError)
    const message = error?.response?.data?.message || error?.message || "Something went wrong"
    throw new Error(message)
  }
}

export const connectGsc = async ({ code, state }: { code: string; state?: string }) => {
  try {
    const response = await axiosInstance.get("/gsc/callback", { params: { code, state } })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || error.message || "Failed to connect GSC")
  }
}

export const getGscAuthUrl = async () => {
  try {
    const response = await axiosInstance.get("/gsc/auth")
    return response.data.url
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || error.message || "Failed to get auth URL")
  }
}

/**
 * Check a published URL's live indexing status via Search Console URL Inspection.
 * Pass either a blogId (resolved to its posted link server-side) or an explicit pageUrl.
 * @param {{ blogId?: string, pageUrl?: string }} params
 * @returns {Promise<{coverageState?: string, verdict?: string, lastCrawlTime?: string,
 *   indexingState?: string, pageFetchState?: string, raw?: Object}>}
 */
export const inspectIndexing = async (
  { blogId, pageUrl }: { blogId?: string; pageUrl?: string } = {}
) => {
  try {
    const response = await axiosInstance.get("/gsc/indexing/inspect", {
      params: pageUrl ? { pageUrl } : { blogId },
    })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    const message =
      error?.response?.data?.message || error?.message || "Failed to check indexing status"
    throw new Error(message)
  }
}

/**
 * Ask Google to (re)crawl a published URL via the Indexing API.
 * Best-effort only — Google decides if and when it actually crawls, and the
 * daily quota is shared across the whole project, so never call this in a loop.
 * @param {{ blogId?: string, pageUrl?: string }} payload
 */
export const requestIndexing = async (
  { blogId, pageUrl }: { blogId?: string; pageUrl?: string } = {}
) => {
  try {
    const response = await axiosInstance.post(
      "/gsc/indexing/request",
      pageUrl ? { pageUrl } : { blogId }
    )
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    const message =
      error?.response?.data?.message || error?.message || "Failed to request indexing"
    throw new Error(message)
  }
}

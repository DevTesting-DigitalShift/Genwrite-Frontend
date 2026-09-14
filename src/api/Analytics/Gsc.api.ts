// src/api/Analytics/Gsc.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"

export const GscAPI = {
  // GET /gsc/data has a single real shape regardless of query params — one controller
  // (GSCService#getBlogsData) handles it — { integrationType, totalBlogs, totalLinks,
  // totalVerifiedSites, totalSitesQueried, gscData }. getVerifiedSites used to treat this as a
  // bare array (`response.data || []`), which was never true; it just hit the same endpoint
  // getAnalytics does. There is no dedicated "list of verified sites" endpoint today.
  getVerifiedSites: async () => {
    try {
      return await apiGet("/gsc/data")
    } catch (err) {
      return rethrow(err, "Failed to fetch verified sites")
    }
  },

  getAnalytics: async (params: Record<string, unknown>) => {
    try {
      return await apiGet("/gsc/data", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch GSC analytics")
    }
  },

  connect: async ({ code, state }: { code: string; state?: string }) => {
    try {
      return await apiGet("/gsc/callback", { query: { code, state } as never })
    } catch (err) {
      return rethrow(err, "Failed to connect GSC")
    }
  },

  getAuthUrl: async () => {
    try {
      const result = await apiGet("/gsc/auth")
      return result.url
    } catch (err) {
      return rethrow(err, "Failed to get auth URL")
    }
  },

  /**
   * Check a published URL's live indexing status via Search Console URL Inspection.
   * Pass either a blogId (resolved to its posted link server-side) or an explicit pageUrl.
   */
  inspectIndexing: async ({ blogId, pageUrl }: { blogId?: string; pageUrl?: string } = {}) => {
    try {
      return await apiGet("/gsc/indexing/inspect", {
        query: (pageUrl ? { pageUrl } : { blogId }) as never,
      })
    } catch (err) {
      return rethrow(err, "Failed to check indexing status")
    }
  },

  /**
   * Ask Google to (re)crawl a published URL via the Indexing API.
   * Best-effort only — Google decides if and when it actually crawls, and the
   * daily quota is shared across the whole project, so never call this in a loop.
   */
  requestIndexing: async ({ blogId, pageUrl }: { blogId?: string; pageUrl?: string } = {}) => {
    try {
      return await apiPost("/gsc/indexing/request", (pageUrl ? { pageUrl } : { blogId }) as never)
    } catch (err) {
      return rethrow(err, "Failed to request indexing")
    }
  },
}

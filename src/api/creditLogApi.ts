import { apiGet, ApiRequestError } from "./typedClient"

export const fetchUserCreditLogs = async (params?: Record<string, unknown>) => {
  try {
    return await apiGet("/api/v1/user/credit-logs", { query: params as never })
  } catch (err) {
    if (err instanceof ApiRequestError)
      throw new Error(err.message || "Failed to fetch credit logs")
    throw err instanceof Error ? err : new Error("Failed to fetch credit logs")
  }
}

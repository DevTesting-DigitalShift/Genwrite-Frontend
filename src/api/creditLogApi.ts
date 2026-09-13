import { apiGet, rethrow } from "./typedClient"

export const fetchUserCreditLogs = async (params?: Record<string, unknown>) => {
  try {
    return await apiGet("/user/credit-logs", { query: params as never })
  } catch (err) {
    return rethrow(err, "Failed to fetch credit logs")
  }
}

// src/api/CreditLog/CreditLog.api.ts
import { apiGet, rethrow } from "@api/typedClient"

export const CreditLogAPI = {
  list: async (params?: Record<string, unknown>) => {
    try {
      return await apiGet("/user/credit-logs", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch credit logs")
    }
  },
}

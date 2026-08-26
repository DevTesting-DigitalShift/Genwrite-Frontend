import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchUserCreditLogs } from "@api/creditLogApi"

export const useCreditLogsQuery = (queryParams?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["creditLogs", queryParams],
    queryFn: () => fetchUserCreditLogs(queryParams),
    // React Query v5 removed `keepPreviousData`; this is its replacement.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

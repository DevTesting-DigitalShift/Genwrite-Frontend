import { useQuery } from "@tanstack/react-query"
import { fetchUserCreditLogs } from "@api/creditLogApi"

export const useCreditLogsQuery = queryParams => {
  return useQuery({
    queryKey: ["creditLogs", queryParams],
    queryFn: () => fetchUserCreditLogs(queryParams),
    keepPreviousData: true, // Useful for pagination to avoid flickering
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

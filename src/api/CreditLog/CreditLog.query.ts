// src/api/CreditLog/CreditLog.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { keepPreviousData } from "@tanstack/react-query"
import { CreditLogAPI } from "./CreditLog.api"
import type { ApiResponse } from "@/types/apiHelpers"

type CreditLogsResponse = ApiResponse<"/user/credit-logs", "get">

class CreditLogQuery extends QueryBase<unknown> {
  baseKey = ["creditLogs"]
  api = CreditLogAPI

  useList = (params?: Record<string, unknown>, options?: AnyUseQueryOptions<CreditLogsResponse>) =>
    this.useParamQuery<CreditLogsResponse, typeof params>(
      "list",
      (p) => this.api.list(p),
      params,
      // Keeps the previous page's data visible while a new page loads, instead of an
      // empty-state flash. React Query v5 removed `keepPreviousData: true`; this is
      // its replacement.
      { placeholderData: keepPreviousData, staleTime: 5 * 60 * 1000, ...options }
    )
}

export const creditLogQuery = new CreditLogQuery() as CreditLogQuery

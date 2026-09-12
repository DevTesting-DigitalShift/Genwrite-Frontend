/**
 * Thin typed wrapper around axiosInstance: pass the OpenAPI path key (from
 * src/types/apiSchema.d.ts) as the single source of truth and the response type,
 * path-param substitution, query typing, response unwrapping, and error normalization
 * all come along for free — no separate `ApiResponse<Path, Method>` annotation, no
 * `response.data` unwrap, no `asApiError`/`.response.data` digging at the call site.
 *
 *   const blog = await apiGet("/api/v1/blogs/{id}", { params: { id } })
 *   //    ^ typed as the real 200 JSON body for GET /blogs/{id} — not an AxiosResponse
 *
 *   try {
 *     await apiDelete("/api/v1/blogs/{id}", { params: { id } })
 *   } catch (err) {
 *     if (err instanceof ApiRequestError) console.log(err.code, err.message)
 *   }
 *
 * axiosInstance's baseURL already includes /api/v1, so that prefix is stripped before
 * the request goes out; `{param}` segments are substituted from `params`.
 *
 * Whether a call succeeds or fails, axios always puts the JSON body at `.data` — a
 * success response's `.data` and a rejected request's `.response.data` are the same
 * kind of thing (the backend's `sendData`/`sendError` bodies respectively, see
 * GenWrite-Backend/utils/apiResponse.js). `request()` below is the one place that reads
 * both: it resolves with `response.data` on success, and on failure reads
 * `error.response.data` (already shaped like `ErrorResponse` — message/code/details/
 * context) and throws it as a real `ApiRequestError`, instead of leaving every caller to
 * repeat that unwrap.
 */
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"
import type {
  ApiPathParams,
  ApiQueryParams,
  ApiRequestBody,
  ApiResponse,
  PathsWithMethod,
} from "@/types/apiHelpers"
import axiosInstance from "."

const API_PREFIX = "/api/v1"

const buildUrl = (pathKey: string, params?: Record<string, string | number>): string => {
  const relative = pathKey.startsWith(API_PREFIX) ? pathKey.slice(API_PREFIX.length) : pathKey
  if (!params) return relative
  return relative.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(params[key])))
}

/** The real error body every failed request sends — see backend `schemas/common.js#ErrorResponseSchema`. */
interface ErrorBody {
  message?: string
  code?: string
  details?: unknown
  context?: { method?: string; path?: string }
}

/**
 * Thrown by every `api*` call below instead of a raw axios error. `.message`/`.code`/
 * `.details`/`.context` come straight from the backend's `ErrorResponse` body — no
 * `err.response?.data?.message` digging needed. `.status` is the HTTP status, or
 * `undefined` for a network-level failure that never got a response at all.
 */
export class ApiRequestError extends Error {
  code?: string
  details?: unknown
  context?: ErrorBody["context"]
  status?: number

  constructor(body: ErrorBody, status: number | undefined, fallbackMessage: string) {
    super(body.message || fallbackMessage)
    this.name = "ApiRequestError"
    this.code = body.code
    this.details = body.details
    this.context = body.context
    this.status = status
  }
}

const request = async <T>(fn: () => Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const response = await fn()
    return response.data
  } catch (rawError) {
    const axiosErr = rawError as AxiosError<ErrorBody>
    throw new ApiRequestError(
      axiosErr.response?.data ?? {},
      axiosErr.response?.status,
      axiosErr.message || "Request failed"
    )
  }
}

interface RequestOptions<Params, Query> {
  params?: Params
  query?: Query
  config?: AxiosRequestConfig
}

export const apiGet = <Path extends PathsWithMethod<"get">>(
  path: Path,
  options?: RequestOptions<ApiPathParams<Path, "get">, ApiQueryParams<Path, "get">>
): Promise<ApiResponse<Path, "get">> =>
  request(() =>
    axiosInstance.get(buildUrl(path, options?.params as Record<string, string | number>), {
      ...options?.config,
      params: options?.query ?? options?.config?.params,
    })
  )

export const apiDelete = <Path extends PathsWithMethod<"delete">>(
  path: Path,
  options?: RequestOptions<ApiPathParams<Path, "delete">, ApiQueryParams<Path, "delete">>
): Promise<ApiResponse<Path, "delete">> =>
  request(() =>
    axiosInstance.delete(buildUrl(path, options?.params as Record<string, string | number>), {
      ...options?.config,
      params: options?.query ?? options?.config?.params,
    })
  )

export const apiPost = <Path extends PathsWithMethod<"post">>(
  path: Path,
  body?: ApiRequestBody<Path, "post">,
  options?: RequestOptions<ApiPathParams<Path, "post">, ApiQueryParams<Path, "post">>
): Promise<ApiResponse<Path, "post">> =>
  request(() =>
    axiosInstance.post(
      buildUrl(path, options?.params as Record<string, string | number>),
      body,
      options?.config
    )
  )

export const apiPut = <Path extends PathsWithMethod<"put">>(
  path: Path,
  body?: ApiRequestBody<Path, "put">,
  options?: RequestOptions<ApiPathParams<Path, "put">, ApiQueryParams<Path, "put">>
): Promise<ApiResponse<Path, "put">> =>
  request(() =>
    axiosInstance.put(
      buildUrl(path, options?.params as Record<string, string | number>),
      body,
      options?.config
    )
  )

export const apiPatch = <Path extends PathsWithMethod<"patch">>(
  path: Path,
  body?: ApiRequestBody<Path, "patch">,
  options?: RequestOptions<ApiPathParams<Path, "patch">, ApiQueryParams<Path, "patch">>
): Promise<ApiResponse<Path, "patch">> =>
  request(() =>
    axiosInstance.patch(
      buildUrl(path, options?.params as Record<string, string | number>),
      body,
      options?.config
    )
  )

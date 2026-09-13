/**
 * Thin typed wrapper around axiosInstance: pass the OpenAPI path key (short form — see
 * below) as the single source of truth and the response type, path-param substitution,
 * query typing, response unwrapping, and error normalization all come along for free — no
 * separate `ApiResponse<Path, Method>` annotation, no `response.data` unwrap, no
 * `asApiError`/`.response.data` digging at the call site.
 *
 *   const blog = await apiGet("/blogs/{id}", { params: { id } })
 *   //    ^ typed as the real 200 JSON body for GET /blogs/{id} — not an AxiosResponse
 *
 *   try {
 *     await apiDelete("/blogs/{id}", { params: { id } })
 *   } catch (err) {
 *     if (err instanceof ApiRequestError) console.log(err.code, err.message)
 *   }
 *
 * Every path the backend registers is spelled "/api/v1/..." in the generated apiSchema.d.ts
 * (that's how the OpenAPI spec documents it), and axiosInstance's own baseURL already
 * includes that same prefix — so call sites here use the SHORT path ("/blogs/{id}", no
 * "/api/v1"), and apiHelpers.ts's `FullPath` type re-adds the prefix purely at the type
 * level to look each path up in the generated `paths` type. Neither this file's runtime
 * code nor any call site ever needs to say "/api/v1" itself. `{param}` segments in the
 * path are substituted from `params`.
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

const buildUrl = (pathKey: string, params?: Record<string, string | number>): string => {
  if (!params) return pathKey
  return pathKey.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(params[key])))
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

/**
 * Normalizes any caught error into a plain `Error` carrying the real backend message —
 * `ApiRequestError`'s `.message` when there is one, `fallback` otherwise. Every `api*`
 * call site used to paste its own copy of this; centralized here since it's always the
 * same three lines. Only use this where the caller doesn't need `.status`/`.code`/
 * `.details` afterward (e.g. to branch on a specific HTTP status) — those callers should
 * let the real `ApiRequestError` propagate instead (see stripeApi.ts#createStripeSession).
 */
export const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

const request = async <T>(fn: () => Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const response = await fn()
    console.debug(
      "API request success:",
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status
    )
    return response.data
  } catch (rawError) {
    const axiosErr = rawError as AxiosError<ErrorBody>
    console.debug(
      "API request failed:",
      axiosErr.config?.method?.toUpperCase(),
      axiosErr.config?.url,
      axiosErr.response?.status
    )
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

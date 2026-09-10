/**
 * Thin typed wrapper around axiosInstance: pass the OpenAPI path key (from
 * src/types/apiSchema.d.ts) as the single source of truth and the response type,
 * path-param substitution, and query typing all come along for free — no separate
 * `ApiResponse<Path, Method>` annotation needed at the call site.
 *
 *   const { data } = await apiGet("/api/v1/blogs/{id}", { params: { id } })
 *   //     ^ typed as the real 200 JSON body for GET /blogs/{id}
 *
 * axiosInstance's baseURL already includes /api/v1, so that prefix is stripped
 * before the request goes out; `{param}` segments are substituted from `params`.
 */
import type { AxiosRequestConfig, AxiosResponse } from "axios"
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

interface RequestOptions<Params, Query> {
  params?: Params
  query?: Query
  config?: AxiosRequestConfig
}

export const apiGet = <Path extends PathsWithMethod<"get">>(
  path: Path,
  options?: RequestOptions<ApiPathParams<Path, "get">, ApiQueryParams<Path, "get">>
): Promise<AxiosResponse<ApiResponse<Path, "get">>> =>
  axiosInstance.get(buildUrl(path, options?.params as Record<string, string | number>), {
    ...options?.config,
    params: options?.query ?? options?.config?.params,
  })

export const apiDelete = <Path extends PathsWithMethod<"delete">>(
  path: Path,
  options?: RequestOptions<ApiPathParams<Path, "delete">, ApiQueryParams<Path, "delete">>
): Promise<AxiosResponse<ApiResponse<Path, "delete">>> =>
  axiosInstance.delete(buildUrl(path, options?.params as Record<string, string | number>), {
    ...options?.config,
    params: options?.query ?? options?.config?.params,
  })

export const apiPost = <Path extends PathsWithMethod<"post">>(
  path: Path,
  body?: ApiRequestBody<Path, "post">,
  options?: RequestOptions<ApiPathParams<Path, "post">, ApiQueryParams<Path, "post">>
): Promise<AxiosResponse<ApiResponse<Path, "post">>> =>
  axiosInstance.post(
    buildUrl(path, options?.params as Record<string, string | number>),
    body,
    options?.config
  )

export const apiPut = <Path extends PathsWithMethod<"put">>(
  path: Path,
  body?: ApiRequestBody<Path, "put">,
  options?: RequestOptions<ApiPathParams<Path, "put">, ApiQueryParams<Path, "put">>
): Promise<AxiosResponse<ApiResponse<Path, "put">>> =>
  axiosInstance.put(
    buildUrl(path, options?.params as Record<string, string | number>),
    body,
    options?.config
  )

export const apiPatch = <Path extends PathsWithMethod<"patch">>(
  path: Path,
  body?: ApiRequestBody<Path, "patch">,
  options?: RequestOptions<ApiPathParams<Path, "patch">, ApiQueryParams<Path, "patch">>
): Promise<AxiosResponse<ApiResponse<Path, "patch">>> =>
  axiosInstance.patch(
    buildUrl(path, options?.params as Record<string, string | number>),
    body,
    options?.config
  )

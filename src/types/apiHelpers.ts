/**
 * Pulls response/request body types out of the generated `paths` type (src/types/apiSchema.d.ts)
 * so axios calls in src/api/*.ts can be annotated against the real backend contract instead
 * of returning `any`. Regenerate apiSchema.d.ts (`npm run gen:api-types`) when the backend's
 * OpenAPI spec changes; these helpers don't need touching.
 *
 * Every generated path key is prefixed "/api/v1/..." (that's how the backend registers them),
 * but axiosInstance's own baseURL already includes that prefix — so call sites use the SHORT
 * path ("/blogs/{id}"), and `FullPath` below re-adds the prefix purely at the type level to
 * look the key up in `paths`. No call site or runtime code ever needs to say "/api/v1" itself.
 */
import type { paths } from "./apiSchema"

type JsonContent<T> = T extends { content: { "application/json": infer B } } ? B : never

/** openapi-typescript emits response status codes as numeric literal keys (200, not "200"). */
type SuccessCode = 200 | 201 | 202 | 204

/** Re-adds the "/api/v1" prefix every generated path key actually has, so a short call-site
 * path can index into `paths`. */
type FullPath<Path extends string> = `/api/v1${Path}`

/** The 2xx JSON body for `paths[FullPath<Path>][Method]`, e.g. ApiResponse<"/blogs", "get">. */
export type ApiResponse<Path extends string, Method extends string> =
  FullPath<Path> extends keyof paths
    ? Method extends keyof paths[FullPath<Path>] & string
      ? paths[FullPath<Path>][Method] extends { responses: infer R }
        ? R extends Record<string | number, unknown>
          ? JsonContent<R[Extract<keyof R, SuccessCode>]>
          : never
        : never
      : never
    : never

/** The JSON request body for `paths[FullPath<Path>][Method]`, e.g. ApiRequestBody<"/blogs", "post">. */
export type ApiRequestBody<Path extends string, Method extends string> =
  FullPath<Path> extends keyof paths
    ? Method extends keyof paths[FullPath<Path>] & string
      ? paths[FullPath<Path>][Method] extends { requestBody?: infer RB }
        ? JsonContent<RB>
        : never
      : never
    : never

/** Every short OpenAPI path (prefix stripped) that declares the given method — the set
 * typedClient.ts's per-method helpers accept. */
export type PathsWithMethod<Method extends string> = {
  [Path in keyof paths]: paths[Path] extends Record<Method, unknown>
    ? Path extends FullPath<infer Short>
      ? Short
      : never
    : never
}[keyof paths]

/** `{ id: string }`-style params for `paths[FullPath<Path>][Method]`, or `never` if the route takes none. */
export type ApiPathParams<Path extends string, Method extends string> =
  FullPath<Path> extends keyof paths
    ? Method extends keyof paths[FullPath<Path>] & string
      ? paths[FullPath<Path>][Method] extends { parameters: { path: infer PP } }
        ? PP
        : never
      : never
    : never

/** Query-string params for `paths[FullPath<Path>][Method]`, or `never` if the route takes none. */
export type ApiQueryParams<Path extends string, Method extends string> =
  FullPath<Path> extends keyof paths
    ? Method extends keyof paths[FullPath<Path>] & string
      ? paths[FullPath<Path>][Method] extends { parameters: { query?: infer QP } }
        ? QP
        : never
      : never
    : never

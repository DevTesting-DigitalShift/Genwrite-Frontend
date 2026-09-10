/**
 * Pulls response/request body types out of the generated `paths` type (src/types/apiSchema.d.ts)
 * so axios calls in src/api/*.ts can be annotated against the real backend contract instead
 * of returning `any`. Regenerate apiSchema.d.ts (`npm run gen:api-types`) when the backend's
 * OpenAPI spec changes; these helpers don't need touching.
 */
import type { paths } from "./apiSchema"

type JsonContent<T> = T extends { content: { "application/json": infer B } } ? B : never

/** openapi-typescript emits response status codes as numeric literal keys (200, not "200"). */
type SuccessCode = 200 | 201 | 202 | 204

/** The 2xx JSON body for `paths[Path][Method]`, e.g. ApiResponse<"/api/v1/blogs", "get">. */
export type ApiResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path] & string,
> = paths[Path][Method] extends { responses: infer R }
  ? R extends Record<string | number, unknown>
    ? JsonContent<R[Extract<keyof R, SuccessCode>]>
    : never
  : never

/** The JSON request body for `paths[Path][Method]`, e.g. ApiRequestBody<"/api/v1/blogs", "post">. */
export type ApiRequestBody<
  Path extends keyof paths,
  Method extends keyof paths[Path] & string,
> = paths[Path][Method] extends { requestBody?: infer RB } ? JsonContent<RB> : never

/** Every OpenAPI path key that declares the given method — the set `apiClient.ts`'s per-method helpers accept. */
export type PathsWithMethod<Method extends string> = {
  [Path in keyof paths]: paths[Path] extends Record<Method, unknown> ? Path : never
}[keyof paths]

/** `{ id: string }`-style params for `paths[Path][Method]`, or `never` if the route takes none. */
export type ApiPathParams<
  Path extends keyof paths,
  Method extends keyof paths[Path] & string,
> = paths[Path][Method] extends { parameters: { path: infer PP } } ? PP : never

/** Query-string params for `paths[Path][Method]`, or `never` if the route takes none. */
export type ApiQueryParams<
  Path extends keyof paths,
  Method extends keyof paths[Path] & string,
> = paths[Path][Method] extends { parameters: { query?: infer QP } } ? QP : never

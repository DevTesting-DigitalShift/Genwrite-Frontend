// Plain in-memory holder for the current tab's access token — no persistence, no
// imports. Exists specifically to avoid an import cycle: axios's request
// interceptor (src/api/index.ts) needs the current access token on every request,
// but it can't import useAuthStore directly (index.ts -> useAuthStore -> authApi.ts
// -> index.ts would cycle). useAuthStore.setToken keeps this in sync whenever it
// updates its own Zustand state.
let currentAccessToken: string | null = null

export function getAccessToken(): string | null {
  return currentAccessToken
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token
}

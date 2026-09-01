// Plain in-memory holder for the current tab's access token — no persistence, no
// imports. Exists specifically to avoid an import cycle: axios's request
// interceptor (src/api/index.jsx) needs the current access token on every request,
// but it can't import useAuthStore directly (index.jsx -> useAuthStore -> authApi.jsx
// -> index.jsx would cycle). useAuthStore.setToken keeps this in sync whenever it
// updates its own Zustand state.
let currentAccessToken = null

export function getAccessToken() {
  return currentAccessToken
}

export function setAccessToken(token) {
  currentAccessToken = token
}

let currentCsrfToken = null

export function getCsrfToken() {
  return currentCsrfToken
}

export function setCsrfToken(token) {
  currentCsrfToken = token
}

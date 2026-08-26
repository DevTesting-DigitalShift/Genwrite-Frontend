// GenWrite launched to the public on Aug 1, 2025. Used as the default "start" for
// date-range filters so results aren't silently restricted to "since I signed up" —
// which breaks the moment you're viewing someone else's shared workspace, since the
// account age that matters then is the workspace owner's, not the current viewer's.
export const SITE_LAUNCH_DATE = "2025-08-01T00:00:00.000Z"

interface FilterStartUser {
  createdAt?: string
}

interface FilterStartOptions {
  /**
   * Pass `true` whenever a workspace other than the logged-in user's own is being
   * viewed (e.g. `activeWorkspace` from `useWorkspaceStore` is set) — in that case
   * the viewer's own account age is irrelevant and must never be used.
   */
  isSharedWorkspace?: boolean
}

/** Default start date for a date-range filter. */
export const getDefaultFilterStart = (
  user: FilterStartUser | null | undefined,
  { isSharedWorkspace = false }: FilterStartOptions = {}
): string => {
  if (isSharedWorkspace || !user?.createdAt) return SITE_LAUNCH_DATE
  // Pre-launch/internal test accounts predate the site launch date — fall back to
  // their own createdAt so testers still see their earliest content by default.
  return new Date(user.createdAt) < new Date(SITE_LAUNCH_DATE) ? user.createdAt : SITE_LAUNCH_DATE
}

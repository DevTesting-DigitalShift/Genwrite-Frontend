/** URL checks shared by the reference-link inputs and the form schemas. */

export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase().replace("www.", "")

    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) return null

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const { pathname } = parsed
      if (pathname.startsWith("/watch")) return parsed.searchParams.get("v")
      for (const prefix of ["/embed/", "/v/", "/shorts/"]) {
        if (pathname.startsWith(prefix)) {
          return pathname.slice(prefix.length).split("/")[0].split("?")[0]
        }
      }
      return null
    }
    if (hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0].split("?")[0]
    return null
  } catch {
    return null
  }
}

export type LinkKind = "reference" | "youtube"

/** `null` when the link is acceptable, otherwise the message to show. */
export function validateLink(url: string, kind: LinkKind): string | null {
  if (kind === "youtube") {
    const id = getYouTubeVideoId(url)
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? null
      : "Please enter a valid YouTube video link with a proper video ID."
  }
  try {
    new URL(url)
    return null
  } catch {
    return "Please enter a valid URL (e.g., https://example.com)."
  }
}

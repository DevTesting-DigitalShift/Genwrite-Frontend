import type { UgcSceneKind } from "@api/Pricing/Pricing.api"

export type UgcStructure = { kind: UgcSceneKind; durationSeconds: number }[]

/** Mirrors the backend's UGC_DEFAULT_STRUCTURE / UGC_MAX_SCENES. */
export const DEFAULT_UGC_STRUCTURE: UgcStructure = [
  { kind: "hook", durationSeconds: 5 },
  { kind: "demo", durationSeconds: 6 },
  { kind: "cta", durationSeconds: 5 },
]
export const MAX_UGC_SCENES = 6
export const MIN_SCENE_SECONDS = 3
export const MAX_SCENE_SECONDS = 15
export const MIN_SCRIPT_CHARS = 20

export const SCENE_KIND_LABELS: Record<UgcSceneKind, string> = {
  hook: "Hook — grab attention",
  demo: "Demo — show the app",
  cta: "Wrap-up — call to action",
  talk: "Talk — to camera",
}

export type UgcAdSettings = {
  /** "single" = one clip like any Auto Video run; "multi" = several short scenes stitched. */
  mode: "single" | "multi"
  structure: UgcStructure
  /** A pasted IMAGE PROMPT / VIDEO PROMPT script, used as written. Empty = scenes are written for you. */
  script: string
  pacing: "natural" | "as_written"
  masterAudio: boolean
}

export const DEFAULT_UGC_SETTINGS: UgcAdSettings = {
  mode: "single",
  structure: DEFAULT_UGC_STRUCTURE,
  script: "",
  pacing: "natural",
  masterAudio: true,
}

/** The pasted script, if one is long enough for the backend to accept. */
export const usableScript = (script: string) =>
  script.trim().length >= MIN_SCRIPT_CHARS ? script.trim() : undefined

/** The `ugc` part of the create payload (undefined for a single clip). */
export function ugcPayload(settings: UgcAdSettings) {
  if (settings.mode !== "multi") return undefined
  const script = usableScript(settings.script)
  return {
    ...(script ? { script } : { structure: settings.structure }),
    pacing: settings.pacing,
    masterAudio: settings.masterAudio,
  }
}

/** Total length of the planned scenes, in seconds. */
export const structureSeconds = (structure: UgcStructure) =>
  structure.reduce((sum, s) => sum + s.durationSeconds, 0)

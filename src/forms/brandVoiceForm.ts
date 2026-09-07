import { z } from "zod"
import { buildPayload } from "@/lib/forms"
import { brandVoicePayloadSchema } from "@/types/forms.schemas"

/**
 * Brand voice form — used by the Brand Voice page for both create and edit.
 *
 * `_id` and `selectedVoice` are page state (which brand is being edited, which
 * card is highlighted) that lives alongside the fields for convenience;
 * `toBrandVoicePayload` leaves both behind.
 */

/** Same check the page ran by hand: anything `new URL()` accepts. */
const absoluteUrl = (message: string) =>
  z.string().refine((value) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }, message)

export const brandVoiceFormSchema = z.object({
  nameOfVoice: z.string().trim().min(1, "Name of Voice is required."),

  postLink: z
    .string()
    .trim()
    .min(1, "Post link is required.")
    .pipe(absoluteUrl("Please enter a valid URL (e.g., https://example.com).")),

  sitemapUrl: z
    .string()
    .trim()
    .min(1, "Sitemap URL is required.")
    .pipe(absoluteUrl("Please enter a valid URL (e.g., https://example.com/sitemap.xml).")),

  describeBrand: z.string().trim().min(1, "Brand description is required."),
  persona: z.string().trim().min(1, "Persona is required."),
  keywords: z.array(z.string()).min(1, "At least one keyword is required."),
  logoUrl: z.string(),

  // ---- Page state: validated here, never sent ----
  /** Set while editing an existing brand; decides create vs update on save. */
  _id: z.string().optional(),
  /** The card highlighted in the list beside the form. */
  selectedVoice: z.any().nullable(),
})

export type BrandVoiceFormValues = z.input<typeof brandVoiceFormSchema>

export const brandVoiceFormDefaults: BrandVoiceFormValues = {
  nameOfVoice: "",
  postLink: "",
  sitemapUrl: "",
  describeBrand: "",
  persona: "",
  keywords: [],
  logoUrl: "",
  _id: undefined,
  selectedVoice: null,
}

/**
 * Form state to request body for the brand endpoints.
 *
 * The form calls it `sitemapUrl` and the API calls it `sitemap`; the logo carries
 * a `?t=` cache-buster in the UI that must not be persisted.
 */
export function toBrandVoicePayload(values: BrandVoiceFormValues) {
  return buildPayload("BrandVoice", brandVoicePayloadSchema, {
    nameOfVoice: values.nameOfVoice.trim(),
    postLink: values.postLink.trim(),
    describeBrand: values.describeBrand.trim(),
    sitemap: values.sitemapUrl.trim(),
    persona: values.persona.trim(),
    keywords: values.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    logoUrl: values.logoUrl?.split("?")[0].trim() || "",
  })
}

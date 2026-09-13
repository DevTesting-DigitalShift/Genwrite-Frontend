import type { components } from "@/types/apiSchema"

export type Brand = components["schemas"]["BrandResponse"] & { [key: string]: any }

export type BrandFormFields = Pick<
  Brand,
  "nameOfVoice" | "describeBrand" | "keywords" | "postLink" | "sitemap" | "persona"
>
export type BrandSiteInfo = Pick<
  Brand,
  "nameOfVoice" | "describeBrand" | "keywords" | "postLink" | "persona" | "sitemap"
>

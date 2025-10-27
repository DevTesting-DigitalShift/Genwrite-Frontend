export interface Brand {
  _id: string
  userId: string
  nameOfVoice: string
  postLink: string
  sitemap: string
  keywords: string[]
  describeBrand: string
  [x: string]: any
}

export type BrandFormFields = Pick<
  Brand,
  "nameOfVoice" | "describeBrand" | "keywords" | "postLink" | "sitemap"
>
export type BrandSiteInfo = Pick<Brand, "nameOfVoice" | "describeBrand" | "keywords" | "postLink">

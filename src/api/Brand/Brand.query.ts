// src/api/brand/brand.query.ts
import { AnyUseQueryOptions } from "@api/QueryBase"
import { BaseCRUDQuery } from "@api/BaseCRUDQuery"
import { BrandAPI } from "./Brand.api"
import type { Brand, BrandSiteInfo } from "@/types/brand"

class BrandsQuery extends BaseCRUDQuery<Brand> {
  baseKey = ["brand"]
  api = BrandAPI

  useSiteInfo = (url: string, options?: AnyUseQueryOptions<BrandSiteInfo, Error>) =>
    this.useFetchQuery<BrandSiteInfo>(`siteInfo-${url}`, () => this.api.getSiteInfo(url), options)
}

export const brandsQuery = new BrandsQuery() as BrandsQuery

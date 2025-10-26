// src/api/brand/brand.query.ts
import { BaseCRUDQuery } from "../BaseCRUDQuery"
import { BrandAPI } from "./Brand.api"
import type { Brand } from "@/types/brand"

class BrandsQuery extends BaseCRUDQuery<Brand> {
  baseKey = ["brand"]
  api = BrandAPI

  useSiteInfo = (url: string) =>
    this.useFetchQuery(`siteInfo-${url}`, () => this.api.getSiteInfo(url))
}

export const brandsQuery = new BrandsQuery()

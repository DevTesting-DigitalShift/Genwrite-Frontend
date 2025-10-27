// src/hooks/useEntityMutations.ts
import { mutationFactory } from "@utils/mutationFactory"
import { brandsQuery } from "@api/Brand/Brand.query"
import type { Brand } from "@/types/brand"
// etc.

export const useEntityMutations = () => ({
  brand: mutationFactory(brandsQuery, "Brand Voice"),
})

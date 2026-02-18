import { mutationFactory } from "@utils/mutationFactory"
import { brandsQuery } from "@api/Brand/Brand.query"

export const useEntityMutations = () => ({
  brand: mutationFactory(brandsQuery, "Brand Voice"),
})

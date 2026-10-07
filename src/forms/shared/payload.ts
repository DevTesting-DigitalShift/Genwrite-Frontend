import { IMAGE_SOURCE } from "@/data/blogData"

/**
 * Small payload rules that more than one generation form needs, so they are decided once
 * rather than re-derived (and subtly differently) in each `to*Payload`.
 */

/**
 * Branded images only exist for a brand voice *and* AI or uploaded imagery — the backend
 * rejects the combination otherwise. A switch left on from an earlier choice (brand voice
 * turned off, image source changed to stock) must not reach the wire.
 */
export function resolveCreateBrandedImages(values: {
  isCheckedBrand: boolean
  imageSource: string
  options: { createBrandedImages: boolean }
}): boolean {
  return (
    values.isCheckedBrand &&
    values.options.createBrandedImages &&
    (values.imageSource === IMAGE_SOURCE.AI || values.imageSource === IMAGE_SOURCE.UPLOAD)
  )
}

// All delivery transformations live here. Each builder is a candidate for a
// Cloudinary named transformation (see README, "How we use Cloudinary").
// Every image gets f_auto + q_auto.
import type { CloudinaryImage } from '@cloudinary/url-gen'
import { fill, limitFit, pad } from '@cloudinary/url-gen/actions/resize'
import { format, quality } from '@cloudinary/url-gen/actions/delivery'
import { generativeFill } from '@cloudinary/url-gen/qualifiers/background'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { cld } from '../cloudinary/config'

export const CARD_ASPECT = 3 / 4
export const CARD_WIDTHS = [320, 480, 768] as const

// Generative fill costs ~50 transformation credits per derived image, so it
// only runs when the flyer is far from the card shape. Flip to false for a
// cheap g_auto crop everywhere.
const USE_GENERATIVE_FILL = true

function optimize(img: CloudinaryImage): CloudinaryImage {
  return img.delivery(format('auto')).delivery(quality('auto'))
}

interface Dimensions {
  width?: number | null
  height?: number | null
}

/** Consistent 3:4 card image. Crops with g_auto when close, pads when odd-shaped. */
export function cardImage(publicId: string, width: number, dims: Dimensions = {}): CloudinaryImage {
  const height = Math.round(width / CARD_ASPECT)
  const img = cld.image(publicId)
  const ratio = dims.width && dims.height ? dims.width / dims.height : CARD_ASPECT
  const oddShape = Math.abs(ratio - CARD_ASPECT) / CARD_ASPECT > 0.35

  if (oddShape && USE_GENERATIVE_FILL) {
    img.resize(pad().width(width).height(height).background(generativeFill()))
  } else {
    img.resize(fill().width(width).height(height).gravity(autoGravity()))
  }
  return optimize(img)
}

/** Whole flyer, never cropped, for the detail page. */
export function heroImage(publicId: string, width = 1200): CloudinaryImage {
  return optimize(cld.image(publicId).resize(limitFit().width(width)))
}

/** Upload preview on the submit form. */
export function previewImage(publicId: string, width = 600): CloudinaryImage {
  return optimize(cld.image(publicId).resize(limitFit().width(width)))
}

interface ImageSet {
  src: string
  srcSet: string
}

const toSet = (widths: readonly number[], build: (w: number) => CloudinaryImage, fallback: number): ImageSet => ({
  src: build(fallback).toURL(),
  srcSet: widths.map((w) => `${build(w).toURL()} ${w}w`).join(', '),
})

/** Responsive `src`/`srcSet` for a listing card. */
export function cardImageSet(publicId: string, dims: Dimensions = {}): ImageSet {
  return toSet(CARD_WIDTHS, (w) => cardImage(publicId, w, dims), 480)
}

export const HERO_WIDTHS = [600, 900, 1200] as const

/** Responsive `src`/`srcSet` for the detail page. */
export function heroImageSet(publicId: string): ImageSet {
  return toSet(HERO_WIDTHS, (w) => heroImage(publicId, w), 900)
}

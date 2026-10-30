// Builds the Cloudinary transformation for a listing's share card.
// Pure (no env, no SDK import). The string is meant for `image.addTransformation()`:
// that call URL-encodes every `%` once more, so text here is encoded ONCE and the
// SDK's pass produces the double-encoding Cloudinary needs for , / % ? # etc.
// Font names stay plain ("Bebas Neue") for the same reason.

export const SHARE_WIDTH = 1200
export const SHARE_HEIGHT = 630

// Cloudinary renders the image server-side and can't read our CSS variables, so
// these mirror the DESIGN.md tokens. Keep them in sync with src/index.css.
const COLOR = { bg: '0e0f11', text: 'f0f0f0', muted: '7c8494', accent: 'ff6b35' } as const

const FLYER_BOX_WIDTH = 472 // 3:4 box at full card height
const TEXT_X = 520
const TEXT_WIDTH = SHARE_WIDTH - TEXT_X - 60

export interface ShareFields {
  title: string
  date?: string | null
  location?: string | null
}

// Scripts our two fonts can't draw. Text in them is left off the card.
const UNSUPPORTED = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/
// True emoji can't be rendered at all and make the whole image fail ("Failed rendering text").
const EMOJI = /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u200d|\ufe0e|\ufe0f|\u20e3/gu

/** Cleans text for a layer and encodes it once (the SDK adds the second pass). */
export function layerText(input: string, maxLength: number): string | null {
  let s = input.replace(EMOJI, '').replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!s || UNSUPPORTED.test(s)) return null
  if (s.length > maxLength) s = `${s.slice(0, maxLength - 3).trimEnd()}...`
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

/** Picks a Google font that has the glyphs, falling back to the app's own fonts. */
function fontFor(text: string, preferred: string): { family: string; custom: boolean } {
  if (/[\u1200-\u137f]/.test(text)) return { family: 'Noto Sans Ethiopic', custom: true }
  if (/[\u0600-\u06ff]/.test(text)) return { family: 'Noto Sans Arabic', custom: true }
  return { family: preferred, custom: false }
}

/** Shorter titles get bigger type; long ones step down so they wrap fully instead of being cut. */
const titleSize = (length: number) => (length <= 22 ? 96 : length <= 40 ? 80 : 64)

interface LayerOptions {
  text: string
  font: string
  size: number
  weight?: number
  color: string
  box?: { width: number; height: number }
  gravity: 'north_west' | 'south_west'
  y: number
}

function textLayer(o: LayerOptions): string | null {
  const encoded = layerText(o.text, o.font === 'Bebas Neue' ? 80 : 70)
  if (!encoded) return null
  const { family, custom } = fontFor(o.text, o.font)
  const weight = o.weight && !custom ? `_${o.weight}` : ''
  // Noto fonts measure wider than the Latin ones and got cut off at display sizes.
  const size = custom ? Math.min(o.size, 64) : o.size
  const face = `${family}@google_${size}${weight}`
  // c_fit with a pixel width wraps the text onto new lines; the height cap shrinks
  // very long text to fit the box instead of overflowing the card.
  const fit = o.box ? `,w_${o.box.width},h_${o.box.height}` : ''
  const crop = o.box ? 'c_fit,' : ''
  return `${crop}co_rgb:${o.color},l_text:${face}:${encoded}${fit}/fl_layer_apply,g_${o.gravity},x_${TEXT_X},y_${o.y}`
}

/** Flyer on the left (never cropped), listing text on the right, all on the bg color. */
export function shareCardTransformation({ title, date, location }: ShareFields): string {
  const bg = `b_rgb:${COLOR.bg}`
  const layers: (string | null)[] = [
    textLayer({ text: 'FLYER DIRECTORY', font: 'Inter', size: 22, weight: 700, color: COLOR.accent, gravity: 'north_west', y: 56 }),
    textLayer({
      text: title,
      font: 'Bebas Neue',
      size: titleSize(title.length),
      color: COLOR.text,
      box: { width: TEXT_WIDTH, height: 300 },
      gravity: 'north_west',
      y: 110,
    }),
  ]
  const locationLayer = location
    ? textLayer({ text: location, font: 'Inter', size: 28, color: COLOR.muted, box: { width: TEXT_WIDTH, height: 70 }, gravity: 'south_west', y: 60 })
    : null
  layers.push(
    date
      ? textLayer({ text: date, font: 'Inter', size: 34, weight: 600, color: COLOR.text, gravity: 'south_west', y: locationLayer ? 150 : 60 })
      : null,
    locationLayer,
  )

  return [
    `c_pad,w_${FLYER_BOX_WIDTH},h_${SHARE_HEIGHT},${bg}`, // whole flyer, letterboxed
    `c_pad,w_${SHARE_WIDTH},h_${SHARE_HEIGHT},g_west,${bg}`, // canvas, flyer on the left
    ...layers.filter((l): l is string => l !== null),
  ].join('/')
}

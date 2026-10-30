import { Cloudinary } from '@cloudinary/url-gen'
import { describe, expect, it } from 'vitest'
import { layerText, shareCardTransformation } from './shareCardLayers'

const emoji = String.fromCodePoint(0x1f355) // pizza
const cjk = String.fromCodePoint(0x793e, 0x533a) // two CJK characters
const amharic = String.fromCodePoint(0x12e8, 0x121b, 0x1205) // three Ethiopic characters

const decode = (s: string) => decodeURIComponent(s)

describe('layerText', () => {
  it('encodes characters that would break a Cloudinary URL', () => {
    expect(layerText('a, b/c', 80)).toBe('a%2C%20b%2Fc')
    const encoded = layerText('50% #1 & "x" (y!)', 80)!
    for (const code of ['%25', '%23', '%26', '%22', '%28', '%21', '%29']) expect(encoded).toContain(code)
    expect(encoded).not.toMatch(/[#&"(),!/]/)
  })

  it('strips emoji, which Cloudinary cannot render (the whole image would fail)', () => {
    expect(layerText(`Pizza ${emoji} night`, 80)).toBe('Pizza%20night')
    expect(layerText(emoji + emoji, 80)).toBeNull()
  })

  it('leaves out empty text and scripts the fonts cannot draw', () => {
    expect(layerText('   ', 80)).toBeNull()
    expect(layerText(cjk, 80)).toBeNull()
  })

  it('truncates long text with an ellipsis', () => {
    const out = decode(layerText('x'.repeat(200), 20)!)
    expect(out).toHaveLength(20)
    expect(out.endsWith('...')).toBe(true)
  })
})

describe('shareCardTransformation', () => {
  const fields = { title: 'Free Health Fair', date: 'Sat, Nov 14', location: 'Hall / B' }

  it('puts the whole flyer on the left of a 1200x630 canvas with all three text lines', () => {
    const t = shareCardTransformation(fields)
    expect(t).toContain('c_pad,w_472,h_630')
    expect(t).toContain('c_pad,w_1200,h_630,g_west')
    expect(t).toContain('Bebas Neue@google') // title
    expect(t.match(/l_text:/g)).toHaveLength(4) // brand tag, title, date, location
  })

  it('omits the date and location layers when they are empty', () => {
    expect(shareCardTransformation({ title: 'Free ESL' }).match(/l_text:/g)).toHaveLength(2)
  })

  it('steps the title size down as it gets longer', () => {
    const size = (title: string) => shareCardTransformation({ title }).match(/Bebas Neue@google_(\d+)/)?.[1]
    expect(size('Short title')).toBe('96')
    expect(size('A title of about thirty chars')).toBe('80')
    expect(size('A much longer title that goes on for a good while longer')).toBe('64')
  })

  it('uses a font with the right glyphs for Amharic, capped at 64px', () => {
    const t = shareCardTransformation({ title: amharic })
    expect(Number(t.match(/Noto Sans Ethiopic@google_(\d+)/)?.[1])).toBeLessThanOrEqual(64)
  })

  it('drops an unsupported-script title rather than rendering broken boxes', () => {
    expect(shareCardTransformation({ title: cjk })).not.toContain('Bebas Neue')
  })

  // Guards a real bug: the SDK re-encodes every "%" in addTransformation(). We give it
  // text encoded once so the final URL is double-encoded, which is what Cloudinary needs.
  it('produces a correctly double-encoded URL through the real SDK', () => {
    const cld = new Cloudinary({ cloud: { cloudName: 'test-cloud' } })
    const url = cld
      .image('flyers/x')
      .addTransformation(shareCardTransformation({ title: '50% off, Pie/Cake? #1', date: null, location: null }))
      .toURL()
    expect(url).toContain('Bebas%20Neue@google') // font name stays single-encoded
    expect(url).toContain('%2525') // "%" -> %25 -> %2525
    expect(url).toContain('%252C') // ","
    expect(url).toContain('%252F') // "/"
    expect(url).toContain('%253F') // "?"
    expect(url).toContain('%2523') // "#"
    expect(url).not.toContain('#')
    expect(url).not.toMatch(/Pie\/Cake/)
  })
})

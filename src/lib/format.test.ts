import { describe, expect, it } from 'vitest'
import { formatEventDate, formatShareDate } from './format'

const at = (h: number, m: number) => new Date(2026, 10, 14, h, m).toISOString()
// Newer ICU versions put a narrow no-break space before AM/PM.
const plain = (s: string | null) => s?.replace(/\s/g, ' ')

describe('formatEventDate', () => {
  it('returns null for missing or invalid dates', () => {
    expect(formatEventDate(null)).toBeNull()
    expect(formatEventDate('not a date')).toBeNull()
  })

  it('shows the time only when one was given (midnight means none)', () => {
    expect(formatEventDate(at(10, 30))).toMatch(/\d{1,2}:30/)
    expect(formatEventDate(at(0, 0))).not.toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('formatShareDate', () => {
  it('is compact and always English, whatever the visitor locale', () => {
    expect(plain(formatShareDate(at(10, 0)))).toBe('Sat, Nov 14, 10:00 AM')
    expect(plain(formatShareDate(at(0, 0)))).toBe('Sat, Nov 14')
    expect(formatShareDate(null)).toBeNull()
  })
})

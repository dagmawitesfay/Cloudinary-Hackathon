import { describe, expect, it } from 'vitest'
import { toEventDate, validateListing, type ListingFormValues } from './validateListing'

const valid: ListingFormValues = {
  title: 'Free Health Fair',
  category: 'health',
  date: '2026-11-14',
  time: '10:00',
  location: '',
  contact: '',
  description: '',
  altText: 'A flyer for a health fair',
}

describe('validateListing', () => {
  it('accepts a complete listing with only the required fields', () => {
    expect(validateListing({ ...valid, date: '', time: '' })).toEqual({})
  })

  it('requires a title of 3 to 120 characters', () => {
    expect(validateListing({ ...valid, title: ' a ' }).title).toBeDefined()
    expect(validateListing({ ...valid, title: 'x'.repeat(121) }).title).toBeDefined()
    expect(validateListing({ ...valid, title: 'abc' }).title).toBeUndefined()
  })

  it('requires a known category', () => {
    expect(validateListing({ ...valid, category: '' }).category).toBeDefined()
    expect(validateListing({ ...valid, category: 'nonsense' }).category).toBeDefined()
  })

  it('requires an image description of 5 to 300 characters', () => {
    expect(validateListing({ ...valid, altText: '' }).altText).toBeDefined()
    expect(validateListing({ ...valid, altText: 'y'.repeat(301) }).altText).toBeDefined()
  })

  it('rejects a time with no date', () => {
    expect(validateListing({ ...valid, date: '' }).date).toBeDefined()
  })

  it('enforces the database length limits on optional fields', () => {
    const errors = validateListing({ ...valid, contact: 'c'.repeat(201), location: 'l'.repeat(301), description: 'd'.repeat(2001) })
    expect(Object.keys(errors).sort()).toEqual(['contact', 'description', 'location'])
  })
})

describe('toEventDate', () => {
  it('returns null with no date', () => {
    expect(toEventDate('', '')).toBeNull()
  })

  it('treats the date and time as local time', () => {
    expect(new Date(toEventDate('2026-11-14', '10:30')!).getHours()).toBe(10)
    expect(new Date(toEventDate('2026-11-14', '')!).getHours()).toBe(0)
  })
})

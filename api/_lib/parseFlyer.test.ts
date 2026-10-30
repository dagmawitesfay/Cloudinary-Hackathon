import { describe, expect, it } from 'vitest'
import { parseFlyer } from './parseFlyer'

// A fixed "today" so year inference is deterministic.
const NOW = new Date(2026, 9, 29)

describe('parseFlyer', () => {
  it('reads a typical health-fair flyer', () => {
    const text = `FREE
HEALTH FAIR
Blood pressure checks • Flu shots • Dental screening
Saturday, Nov 14th
10 AM - 2 PM
Eastside Community Center
1420 Maple Ave
Springfield, IL 62704
Call (217) 555-0142 or visit eastsidehealth.org`
    expect(parseFlyer(text, NOW)).toEqual({
      title: 'Free Health Fair',
      eventDate: '2026-11-14T10:00',
      location: '1420 Maple Ave, Springfield, IL 62704',
      contact: '(217) 555-0142 · eastsidehealth.org',
    })
  })

  it('uses a "Where:" label, an M/D date, and an email', () => {
    const text = `Westside Food Pantry
Fresh produce and groceries for families
Every Tuesday 3/10
4:30pm
Where: St. Mark's Church Hall
Questions? pantry@stmarks.org`
    expect(parseFlyer(text, NOW)).toMatchObject({
      title: 'Westside Food Pantry',
      eventDate: '2027-03-10T16:30', // March already passed this year, so next year
      location: "St. Mark's Church Hall",
      contact: 'pantry@stmarks.org',
    })
  })

  it('keeps an explicit year and does not merge a subtitle into the title', () => {
    const result = parseFlyer('ESL Classes\nLearn English for free!\nJanuary 12, 2027 at 6 pm\nLibrary Room B, 88 Oak Street', NOW)
    expect(result.title).toBe('ESL Classes')
    expect(result.eventDate).toBe('2027-01-12T18:00')
    expect(result.location).toBe('Library Room B, 88 Oak Street')
    expect(result.contact).toBeUndefined()
  })

  it('treats a date from the last 30 days as this year, not next', () => {
    expect(parseFlyer('Cleanup Day\nOct 20', NOW).eventDate).toBe('2026-10-20')
  })

  it('returns a date without a time when none is given', () => {
    expect(parseFlyer('Book Sale\nDecember 5', NOW).eventDate).toBe('2026-12-05')
  })

  it('returns nothing for empty or unreadable text instead of guessing', () => {
    expect(parseFlyer('', NOW)).toEqual({ title: undefined, eventDate: undefined, location: undefined, contact: undefined })
    expect(parseFlyer('~~ ## ~~', NOW).title).toBeUndefined()
  })
})

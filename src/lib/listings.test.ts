import { describe, expect, it } from 'vitest'
import { toTsQuery } from './listings'

describe('toTsQuery', () => {
  it('turns words into prefix matches joined with AND', () => {
    expect(toTsQuery('flu shots')).toBe('flu:* & shots:*')
  })

  it('keeps only letters and digits so input cannot change the query', () => {
    expect(toTsQuery("clinic; drop table x --")).toBe('clinic:* & drop:* & table:* & x:*')
    expect(toTsQuery('(a|b)&!c')).toBe('a:* & b:* & c:*')
  })

  it('handles accents, case, and empty input', () => {
    expect(toTsQuery('Café NIÑO')).toBe('café:* & niño:*')
    expect(toTsQuery('!!! ')).toBe('')
    expect(toTsQuery('')).toBe('')
  })
})

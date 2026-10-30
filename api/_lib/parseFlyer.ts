// Heuristics that turn raw flyer OCR text into form suggestions.
// Deliberately conservative: an empty field is better than a wrong one.
import type { FlyerSuggestions } from '../../shared/analyze.js'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const MONTH_DATE =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s+(\d{4}))?/i
const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/
const TIME = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\b\.?/i
const NOON = /\bnoon\b/i
const WEEKDAY = /\b(mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?|sun)(?:day)?\b/i

const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
const EMAIL = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/
const URL = /\b(?:https?:\/\/|www\.)[^\s]+|\b[\w-]+\.(?:org|com|net|edu|gov)(?:\/[^\s]*)?\b/i
const STREET =
  /\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:st(?:reet)?|ave(?:nue)?|rd|road|blvd|boulevard|dr(?:ive)?|ln|lane|way|ct|court|pl(?:ace)?|pkwy|parkway|hwy|highway|cir(?:cle)?|ter(?:race)?)\b\.?/i
const LOCATION_LABEL = /^(?:where|location|place|address|venue)\s*[:-]\s*(.*)$/i

const pad = (n: number) => String(n).padStart(2, '0')

function isMetaLine(line: string): boolean {
  return [MONTH_DATE, NUMERIC_DATE, TIME, PHONE, EMAIL, URL, STREET, LOCATION_LABEL].some((re) => re.test(line))
}

function titleCase(s: string): string {
  // Flyers shout. Only rewrite lines that are entirely upper case.
  if (s !== s.toUpperCase()) return s
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase())
}

export function parseTitle(lines: string[]): string | undefined {
  const head = lines.slice(0, 6)
  const isCandidate = (l: string) =>
    l.length >= 3 && l.length <= 80 && (l.match(/[a-z]/gi)?.length ?? 0) >= 3 && !isMetaLine(l) && !WEEKDAY.test(l)
  const i = head.findIndex(isCandidate)
  if (i === -1) return undefined
  let title = head[i]
  // "FREE" / "HEALTH FAIR" split across lines: join a one-word lead-in.
  const next = head[i + 1]
  if (!title.includes(' ') && next && isCandidate(next) && title.length + next.length < 80) title += ` ${next}`
  return titleCase(title)
}

export function parseDate(text: string, now = new Date()): string | undefined {
  let year: number | undefined
  let month: number | undefined
  let day: number | undefined

  const m = text.match(MONTH_DATE)
  const n = text.match(NUMERIC_DATE)
  if (m) {
    month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase())
    day = Number(m[2])
    year = m[3] ? Number(m[3]) : undefined
  } else if (n) {
    month = Number(n[1]) - 1
    day = Number(n[2])
    year = n[3] ? Number(n[3].length === 2 ? `20${n[3]}` : n[3]) : undefined
  }
  if (month === undefined || day === undefined || month < 0 || month > 11 || day < 1 || day > 31) return undefined

  if (year === undefined) {
    // No year on the flyer: assume the next occurrence (allowing for recent past events).
    year = now.getFullYear()
    const candidate = new Date(year, month, day)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    if (candidate < thirtyDaysAgo) year += 1
  }
  const date = `${year}-${pad(month + 1)}-${pad(day)}`

  const t = text.match(TIME)
  if (t) {
    let hour = Number(t[1]) % 12
    if (t[3].toLowerCase() === 'p') hour += 12
    const minute = t[2] ? Number(t[2]) : 0
    if (minute < 60) return `${date}T${pad(hour)}:${pad(minute)}`
  } else if (NOON.test(text)) {
    return `${date}T12:00`
  }
  return date
}

export function parseLocation(lines: string[]): string | undefined {
  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].match(LOCATION_LABEL)
    if (label) return (label[1] || lines[i + 1] || '').trim() || undefined
  }
  const street = lines.find((l) => STREET.test(l))
  if (!street) return undefined
  // Include a following "City, ST 12345" line when present.
  const next = lines[lines.indexOf(street) + 1]
  return next && /,\s*[A-Z]{2}\b|\b\d{5}\b/.test(next) ? `${street}, ${next}` : street
}

export function parseContact(text: string): string | undefined {
  const found = [text.match(PHONE)?.[0], text.match(EMAIL)?.[0], text.match(URL)?.[0]]
    .filter((v): v is string => Boolean(v))
    // An email's domain also matches URL; drop duplicates.
    .filter((v, i, all) => !all.some((o, j) => j < i && o.includes(v)))
  return found.length ? found.slice(0, 2).join(' · ').slice(0, 200) : undefined
}

export function parseFlyer(text: string, now = new Date()): FlyerSuggestions {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return {
    title: parseTitle(lines),
    eventDate: parseDate(text, now),
    location: parseLocation(lines)?.slice(0, 300),
    contact: parseContact(text),
  }
}

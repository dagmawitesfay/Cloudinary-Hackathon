// Mirrors the CHECK constraints in supabase/migrations/0001_listings.sql.
import { CATEGORIES } from './categories'

export interface ListingFormValues {
  title: string
  category: string
  date: string // YYYY-MM-DD or ''
  time: string // HH:mm or ''
  location: string
  contact: string
  description: string
  altText: string
}

export type FieldErrors = Partial<Record<keyof ListingFormValues, string>>

const LIMITS = { title: [3, 120], altText: [5, 300], location: 300, contact: 200, description: 2000 } as const

export function validateListing(v: ListingFormValues): FieldErrors {
  const errors: FieldErrors = {}
  const title = v.title.trim()
  const alt = v.altText.trim()

  if (title.length < LIMITS.title[0]) errors.title = `Enter a title (at least ${LIMITS.title[0]} characters).`
  else if (title.length > LIMITS.title[1]) errors.title = `Keep the title under ${LIMITS.title[1]} characters.`

  if (!CATEGORIES.some((c) => c.value === v.category)) errors.category = 'Choose a category.'

  if (v.time && !v.date) errors.date = 'Add a date to go with the time.'
  else if (v.date && Number.isNaN(new Date(`${v.date}T${v.time || '00:00'}`).getTime())) {
    errors.date = 'Enter a valid date.'
  }

  if (v.location.trim().length > LIMITS.location) errors.location = `Keep the location under ${LIMITS.location} characters.`
  if (v.contact.trim().length > LIMITS.contact) errors.contact = `Keep the contact under ${LIMITS.contact} characters.`
  if (v.description.trim().length > LIMITS.description) {
    errors.description = `Keep the description under ${LIMITS.description} characters.`
  }

  if (alt.length < LIMITS.altText[0]) {
    errors.altText = 'Describe the image in a few words, for people who cannot see it.'
  } else if (alt.length > LIMITS.altText[1]) {
    errors.altText = `Keep the image description under ${LIMITS.altText[1]} characters.`
  }
  return errors
}

/** Local date + optional time → ISO timestamp (midnight local when no time given). */
export function toEventDate(date: string, time: string): string | null {
  return date ? new Date(`${date}T${time || '00:00'}`).toISOString() : null
}

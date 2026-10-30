import { supabase, isSupabaseConfigured } from './supabase'
import type { Listing, NewListing } from './types'

/**
 * Inserts a pending listing. No `.select()` on purpose: anonymous users can't
 * read pending rows, so asking for the row back would fail under RLS.
 */
export async function submitListing(listing: NewListing): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('The database is not configured. Please try again later.')
  }
  const { error } = await supabase.from('listings').insert(listing)
  if (error) {
    // Full Postgres/PostgREST detail (code, details, hint) for debugging.
    console.error('submitListing failed:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    const friendly = 'We could not save your listing. Please check your connection and try again.'
    // In dev, show the real reason right in the form.
    throw new Error(import.meta.env.DEV ? `${friendly} [dev: ${error.code ?? ''} ${error.message}]` : friendly)
  }
}

export type DateFilter = 'any' | 'upcoming' | 'week' | 'month'

export interface BrowseFilters {
  q: string
  category: string // '' = all
  when: DateFilter
}

// Everything except ocr_raw_text, which only moderators need.
const PUBLIC_COLUMNS =
  'id, created_at, status, title, description, category, event_date, location_text, contact, ' +
  'image_public_id, image_width, image_height, image_alt, tags'

/** "clinic fair" -> "clinic:* & fair:*" (prefix match; letters and digits only). */
export function toTsQuery(q: string): string {
  return (q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((t) => `${t}:*`).join(' & ')
}

const DAY = 24 * 60 * 60 * 1000

export async function fetchApprovedListings(filters: BrowseFilters): Promise<Listing[]> {
  if (!isSupabaseConfigured) throw new Error('The database is not configured.')

  let query = supabase.from('listings').select(PUBLIC_COLUMNS).eq('status', 'approved')

  if (filters.category) query = query.eq('category', filters.category)

  const tsQuery = toTsQuery(filters.q)
  if (tsQuery) query = query.textSearch('search', tsQuery, { config: 'english' })

  if (filters.when !== 'any') {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    query = query.gte('event_date', startOfToday.toISOString())
    if (filters.when === 'week') query = query.lt('event_date', new Date(startOfToday.getTime() + 7 * DAY).toISOString())
    if (filters.when === 'month') query = query.lt('event_date', new Date(startOfToday.getTime() + 30 * DAY).toISOString())
    query = query.order('event_date', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(60)
  if (error) {
    console.error('fetchApprovedListings failed:', error)
    throw new Error('We could not load listings. Please try again.')
  }
  return (data ?? []) as unknown as Listing[]
}

/** Returns null when the listing doesn't exist or isn't approved (RLS hides it). */
export async function fetchListing(id: string): Promise<Listing | null> {
  if (!isSupabaseConfigured) throw new Error('The database is not configured.')
  const { data, error } = await supabase
    .from('listings')
    .select(PUBLIC_COLUMNS)
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) {
    console.error('fetchListing failed:', error)
    // A malformed id (not a uuid) is just "not found" to the visitor.
    if (error.code === '22P02') return null
    throw new Error('We could not load this listing. Please try again.')
  }
  return data as unknown as Listing | null
}

// ---- Moderation (requires a signed-in moderator; RLS enforces it) ----

/** Oldest first, so nothing waits forever. */
export async function fetchPendingListings(): Promise<Listing[]> {
  if (!isSupabaseConfigured) throw new Error('The database is not configured.')
  const { data, error } = await supabase
    .from('listings')
    .select(PUBLIC_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) {
    console.error('fetchPendingListings failed:', error)
    throw new Error('We could not load the review queue. Please try again.')
  }
  return (data ?? []) as unknown as Listing[]
}

/** Approve, reject, or put back to pending (undo). Throws unless exactly one row changed. */
export async function setListingStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending',
  reviewerId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      status,
      reviewed_at: status === 'pending' ? null : new Date().toISOString(),
      reviewed_by: status === 'pending' ? null : reviewerId,
    })
    .eq('id', id)
    .select('id')
  if (error) {
    console.error('setListingStatus failed:', error)
    throw new Error('We could not update that listing. Please try again.')
  }
  // RLS filters rows silently, so "no error" alone doesn't mean it worked.
  if (!data?.length) throw new Error('That listing could not be updated. You may not have moderator access.')
}

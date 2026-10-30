import { supabase, isSupabaseConfigured } from './supabase'
import type { NewListing } from './types'

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

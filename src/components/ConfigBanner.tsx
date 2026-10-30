import { isCloudinaryConfigured } from '../cloudinary/config'
import { isSupabaseConfigured } from '../lib/supabase'
import { ErrorState } from './states'

/** Shown when a deploy is missing environment variables, instead of failing silently. */
export function ConfigBanner() {
  const missing = [
    !isCloudinaryConfigured && 'VITE_CLOUDINARY_CLOUD_NAME',
    !isSupabaseConfigured && 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean)
  if (missing.length === 0) return null
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <ErrorState message={`This site is not fully set up. Missing: ${missing.join(', ')}.`} />
    </div>
  )
}

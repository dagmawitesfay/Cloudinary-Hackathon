import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import { ErrorState, Spinner } from './states'

/** Redirects to login unless the user is signed in AND in the moderators table. */
export function RequireModerator({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    supabase.rpc('is_moderator').then(({ data, error: rpcError }) => {
      if (rpcError) setError(rpcError.message)
      else setAllowed(Boolean(data))
    })
  }, [session])

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/mod/login" replace />
  if (error) return <ErrorState message={`Could not verify moderator access: ${error}`} />
  if (allowed === null) return <Spinner label="Checking access…" />
  if (!allowed) return <ErrorState message="This account is not a moderator." />
  return <>{children}</>
}

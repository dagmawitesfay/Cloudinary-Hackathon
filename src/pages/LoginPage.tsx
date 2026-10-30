import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { ErrorState, Spinner } from '../components/states'
import { useSession } from '../hooks/useSession'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { buttonPrimary, input, inputOk, muted, pageTitle, panel } from '../lib/ui'

export function LoginPage() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <Spinner />
  if (session) return <Navigate to="/mod" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isSupabaseConfigured) {
      setError('Sign-in is not configured.')
      return
    }
    setBusy(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (signInError) {
      console.error('sign-in failed:', signInError.message)
      // Same message for a wrong email and a wrong password.
      setError(
        signInError.status === 400 || signInError.status === 401
          ? 'That email and password did not match. Please try again.'
          : 'We could not sign you in. Please try again.',
      )
    }
    // On success useSession updates and the <Navigate> above takes over.
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className={pageTitle}>Moderator login</h1>
      <p className={`mt-3 ${muted}`}>For people who review new listings.</p>

      <form onSubmit={handleSubmit} className={`${panel} mt-6 space-y-4`}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${input} ${inputOk}`}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${input} ${inputOk}`}
          />
        </div>
        {error && <ErrorState message={error} />}
        <button type="submit" disabled={busy} aria-busy={busy} className={`${buttonPrimary} w-full`}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}

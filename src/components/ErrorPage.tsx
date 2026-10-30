import { Link, useRouteError } from 'react-router'
import { buttonPrimary, buttonSecondary, pageTitle } from '../lib/ui'

/** Router-level fallback for a crash while rendering or loading a route. */
export function ErrorPage() {
  const error = useRouteError()
  console.error('Route error:', error)
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className={pageTitle}>Something went wrong</h1>
      <p className="mt-4 text-muted">The page hit a problem. Reloading usually fixes it.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => window.location.reload()} className={buttonPrimary}>
          Reload
        </button>
        <Link to="/" className={buttonSecondary}>
          Go to Browse
        </Link>
      </div>
    </main>
  )
}

import { useTitle } from '../hooks/useTitle'
import { pageTitle } from '../lib/ui'

export function NotFoundPage() {
  useTitle('Page not found')
  return (
    <section>
      <h1 className={pageTitle}>Page not found</h1>
      <p className="mt-3 text-muted">That page doesn't exist.</p>
    </section>
  )
}

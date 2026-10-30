import { pageTitle } from '../lib/ui'

export function NotFoundPage() {
  return (
    <section>
      <h1 className={pageTitle}>Page not found</h1>
      <p className="mt-3 text-muted">That page doesn't exist.</p>
    </section>
  )
}

import { pageTitle } from '../lib/ui'

export function ModQueuePage() {
  return (
    <section>
      <h1 className={pageTitle}>Pending listings</h1>
      <p className="mt-3 text-muted">Approve or reject submissions. Coming in Phase 5.</p>
    </section>
  )
}

import { useParams } from 'react-router'
import { pageTitle } from '../lib/ui'

export function ListingPage() {
  const { id } = useParams()
  return (
    <section>
      <h1 className={pageTitle}>Listing</h1>
      <p className="mt-3 text-muted">Details for {id}. Coming in Phase 4.</p>
    </section>
  )
}

import { useParams } from 'react-router'

export function ListingPage() {
  const { id } = useParams()
  return (
    <section>
      <h1 className="text-2xl font-bold">Listing</h1>
      <p className="mt-2 text-stone-600">Details for {id}. Coming in Phase 4.</p>
    </section>
  )
}

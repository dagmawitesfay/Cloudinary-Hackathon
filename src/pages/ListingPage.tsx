import { Link, useParams } from 'react-router'
import { CategoryBadge } from '../components/Badge'
import { ShareCard } from '../components/ShareCard'
import { EmptyState, ErrorState, Spinner } from '../components/states'
import { useListing } from '../hooks/useListings'
import { useTitle } from '../hooks/useTitle'
import { heroImageSet } from '../lib/cloudinary'
import { formatEventDate } from '../lib/format'
import { buttonSecondary, pageTitle } from '../lib/ui'

export function ListingPage() {
  const { id } = useParams()
  const { loading, data: listing, error, retry } = useListing(id)
  useTitle(listing?.title ?? (loading ? 'Loading listing' : 'Listing not found'))

  if (loading) return <Spinner label="Loading listing…" />

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorState message={error} />
        <button type="button" onClick={retry} className={buttonSecondary}>
          Try again
        </button>
      </div>
    )
  }

  if (!listing) {
    return (
      <EmptyState title="Listing not found">
        <p>It may have been removed, or it hasn't been approved yet.</p>
        <Link to="/" className={`${buttonSecondary} mt-6`}>
          Browse listings
        </Link>
      </EmptyState>
    )
  }

  const { src, srcSet } = heroImageSet(listing.image_public_id)
  const date = formatEventDate(listing.event_date)

  return (
    <>
      <article className="grid gap-10 lg:grid-cols-2">
        <img
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 1024px) 560px, 92vw"
          alt={listing.image_alt}
          width={listing.image_width ?? undefined}
          height={listing.image_height ?? undefined}
          decoding="async"
          className="h-auto w-full rounded-xl border border-border"
        />

        <div>
          <Link to="/" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
            ← All listings
          </Link>
          <h1 className={`${pageTitle} mt-4`}>{listing.title}</h1>

          <dl className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <dt className="sr-only">Category</dt>
              <dd>
                <CategoryBadge category={listing.category} />
              </dd>
            </div>
            {date && (
              <div>
                <dt className="text-sm text-muted">When</dt>
                <dd>{date}</dd>
              </div>
            )}
            {listing.location_text && (
              <div>
                <dt className="text-sm text-muted">Where</dt>
                <dd>{listing.location_text}</dd>
              </div>
            )}
            {listing.contact && (
              <div>
                <dt className="text-sm text-muted">Contact</dt>
                <dd>{listing.contact}</dd>
              </div>
            )}
          </dl>

          {listing.description && <p className="mt-6 whitespace-pre-line text-text">{listing.description}</p>}
        </div>
      </article>
      <ShareCard listing={listing} />
    </>
  )
}

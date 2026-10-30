import { Link } from 'react-router'
import { cardImageSet } from '../lib/cloudinary'
import { formatEventDate } from '../lib/format'
import { card } from '../lib/ui'
import type { Listing } from '../lib/types'
import { CategoryBadge } from './Badge'

const SIZES = '(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw'

export function ListingCard({ listing }: { listing: Listing }) {
  const { src, srcSet } = cardImageSet(listing.image_public_id, {
    width: listing.image_width,
    height: listing.image_height,
  })
  const date = formatEventDate(listing.event_date)

  return (
    <Link to={`/listing/${listing.id}`} className={card}>
      <div className="aspect-[3/4] bg-bg">
        <img
          src={src}
          srcSet={srcSet}
          sizes={SIZES}
          alt={listing.image_alt}
          width={480}
          height={640}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CategoryBadge category={listing.category} />
          {date && <span className="text-sm text-muted">{date}</span>}
        </div>
        <h2 className="text-lg font-semibold leading-snug">{listing.title}</h2>
      </div>
    </Link>
  )
}

import { Link } from 'react-router'
import { EmptyState } from '../components/states'
import { buttonSecondary } from '../lib/ui'

export function HomePage() {
  return (
    <section>
      <h1 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-wide sm:text-6xl lg:text-8xl">
        Find what's happening in your neighborhood.
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Clinics, food drives, classes, and community events, from the flyers on your block.
      </p>

      {/* Filter pills and the listing grid arrive in Phase 4. */}
      <div className="mt-12">
        <EmptyState title="No listings yet">
          <p>Spotted a flyer? Snap it and add it so neighbors can find it.</p>
          <Link to="/submit" className={`${buttonSecondary} mt-6`}>
            Add a flyer
          </Link>
        </EmptyState>
      </div>
    </section>
  )
}

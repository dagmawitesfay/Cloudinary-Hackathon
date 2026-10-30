import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FilterPills } from '../components/FilterPills'
import { ListingCard } from '../components/ListingCard'
import { EmptyState, ErrorState, Spinner } from '../components/states'
import { useListings } from '../hooks/useListings'
import { CATEGORIES } from '../lib/categories'
import type { DateFilter } from '../lib/listings'
import { buttonSecondary, input, inputOk } from '../lib/ui'

const CATEGORY_OPTIONS = [{ value: '', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]

const WHEN_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
]

const isDateFilter = (v: string | null): v is DateFilter => WHEN_OPTIONS.some((o) => o.value === v)

export function HomePage() {
  // Filters live in the URL so a search can be shared and survives refresh.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = CATEGORIES.some((c) => c.value === params.get('category')) ? params.get('category')! : ''
  const whenParam = params.get('when')
  const when: DateFilter = isDateFilter(whenParam) ? whenParam : 'any'

  const [text, setText] = useState(q)
  useEffect(() => {
    if (text.trim() === q.trim()) return
    const t = setTimeout(() => update({ q: text.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- update only reads the current params
  }, [text])

  function update(changes: Record<string, string>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (v && v !== 'any') next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true },
    )
  }

  const { loading, data, error, retry } = useListings({ q, category, when })
  const filtered = Boolean(q || category || when !== 'any')

  function clearFilters() {
    setText('')
    setParams({}, { replace: true })
  }

  return (
    <section>
      <h1 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-wide sm:text-6xl lg:text-8xl">
        Find what's happening in your neighborhood.
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Clinics, food drives, classes, and community events, from the flyers on your block.
      </p>

      <div className="mt-10 space-y-4">
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="search" className="block text-sm font-medium">
            Search listings
          </label>
          <input
            id="search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Try “flu shots” or “English class”"
            autoComplete="off"
            className={`${input} ${inputOk} sm:max-w-md`}
          />
        </form>
        <FilterPills label="Category" options={CATEGORY_OPTIONS} value={category} onChange={(v) => update({ category: v })} />
        <FilterPills label="When" options={WHEN_OPTIONS} value={when} onChange={(v) => update({ when: v })} />
      </div>

      <div className="mt-10" aria-live="polite" aria-busy={loading}>
        {loading && <Spinner label="Loading listings…" />}

        {error && (
          <div className="space-y-3">
            <ErrorState message={error} />
            <button type="button" onClick={retry} className={buttonSecondary}>
              Try again
            </button>
          </div>
        )}

        {data && data.length === 0 && (
          <EmptyState title={filtered ? 'No matches' : 'No listings yet'}>
            {filtered ? (
              <>
                <p>Nothing matches those filters. Try fewer words or a different category.</p>
                <button type="button" onClick={clearFilters} className={`${buttonSecondary} mt-6`}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p>Spotted a flyer? Snap it and add it so neighbors can find it.</p>
                <Link to="/submit" className={`${buttonSecondary} mt-6`}>
                  Add a flyer
                </Link>
              </>
            )}
          </EmptyState>
        )}

        {data && data.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted">
              {data.length} {data.length === 1 ? 'listing' : 'listings'}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((l) => (
                <li key={l.id}>
                  <ListingCard listing={l} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

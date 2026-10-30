import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FilterPills } from '../components/FilterPills'
import { ListingCard } from '../components/ListingCard'
import { EmptyState, ErrorState, Spinner } from '../components/states'
import { useListings } from '../hooks/useListings'
import { useTitle } from '../hooks/useTitle'
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
  useTitle()
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
      <div className="relative isolate">
        {/* Decorative glow: full-bleed to the top-right of the window, behind the hero. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 -z-10 ml-[-50vw] h-[640px] w-screen bg-[radial-gradient(ellipse_at_100%_0%,color-mix(in_srgb,var(--accent)_8%,transparent)_0%,transparent_60%)]"
        />

        <p className="flex items-center gap-2 font-pixel text-xs uppercase tracking-[0.2em] text-accent">
          <span aria-hidden="true" className="inline-block h-2 w-2 bg-accent" />
          Boston · Community flyers
        </p>

        {/* One real heading. Stacked with block spans; the spaces keep it reading as one sentence. */}
        <h1 className="mt-5 font-hero text-5xl font-extrabold uppercase leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="block">Find what's</span>{' '}
          <span className="block">happening</span>{' '}
          <span className="block">
            near you<span className="text-accent">.</span>
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
          Clinics, food drives, classes, and community events, from the flyers on your block. The free flu clinic, the
          Saturday ESL class, the church food pantry.
        </p>
      </div>

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

      {/* Screen readers hear a short status, not the whole grid re-read on every change. */}
      <p role="status" className="sr-only">
        {loading ? 'Loading listings' : data ? `${data.length} ${data.length === 1 ? 'listing' : 'listings'} found` : ''}
      </p>

      <div className="mt-10">
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

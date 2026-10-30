import { useState } from 'react'
import { Link } from 'react-router'
import { CategoryBadge } from '../components/Badge'
import { EmptyState, ErrorState, Spinner, SuccessAlert } from '../components/states'
import { usePendingListings } from '../hooks/usePendingListings'
import { useSession } from '../hooks/useSession'
import { cardImage, heroImage } from '../lib/cloudinary'
import { formatEventDate } from '../lib/format'
import { setListingStatus } from '../lib/listings'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import { buttonPrimary, buttonSecondary, muted, pageTitle, panel } from '../lib/ui'

interface Done {
  id: string
  title: string
  status: 'approved' | 'rejected'
}

export function ModQueuePage() {
  const { session } = useSession()
  const { loading, data, error, retry } = usePendingListings()
  const [handled, setHandled] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [last, setLast] = useState<Done | null>(null)

  const reviewerId = session?.user.id
  const pending = (data ?? []).filter((l) => !handled.has(l.id))

  async function act(listing: Listing, status: 'approved' | 'rejected') {
    if (!reviewerId) return
    setBusyId(listing.id)
    setActionError(null)
    try {
      await setListingStatus(listing.id, status, reviewerId)
      setHandled((prev) => new Set(prev).add(listing.id))
      setLast({ id: listing.id, title: listing.title, status })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusyId(null)
    }
  }

  async function undo() {
    if (!last || !reviewerId) return
    setActionError(null)
    try {
      await setListingStatus(last.id, 'pending', reviewerId)
      setHandled((prev) => {
        const next = new Set(prev)
        next.delete(last.id)
        return next
      })
      setLast(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Pending listings</h1>
          <p className={`mt-3 ${muted}`}>Signed in as {session?.user.email}</p>
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()} className={buttonSecondary}>
          Sign out
        </button>
      </div>

      <div className="mt-8 space-y-4" aria-live="polite">
        {last && (
          <SuccessAlert>
            {last.status === 'approved' ? 'Approved' : 'Rejected'} “{last.title}”.{' '}
            <button type="button" onClick={undo} className="font-bold underline underline-offset-4">
              Undo
            </button>
          </SuccessAlert>
        )}
        {actionError && <ErrorState message={actionError} />}
      </div>

      <div className="mt-8" aria-busy={loading}>
        {loading && <Spinner label="Loading the queue…" />}

        {error && (
          <div className="space-y-3">
            <ErrorState message={error} />
            <button type="button" onClick={retry} className={buttonSecondary}>
              Try again
            </button>
          </div>
        )}

        {data && pending.length === 0 && (
          <EmptyState title="All caught up">
            <p>There are no listings waiting for review.</p>
            <Link to="/" className={`${buttonSecondary} mt-6`}>
              View public listings
            </Link>
          </EmptyState>
        )}

        {pending.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted">{pending.length} waiting, oldest first</p>
            <ul className="space-y-6">
              {pending.map((l) => (
                <li key={l.id}>
                  <PendingCard listing={l} busy={busyId === l.id} onAct={(s) => act(l, s)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

function PendingCard({
  listing,
  busy,
  onAct,
}: {
  listing: Listing
  busy: boolean
  onAct: (status: 'approved' | 'rejected') => void
}) {
  const date = formatEventDate(listing.event_date)
  const thumb = cardImage(listing.image_public_id, 320, {
    width: listing.image_width,
    height: listing.image_height,
  }).toURL()
  const full = heroImage(listing.image_public_id, 1600).toURL()

  const rows: [string, string | null][] = [
    ['When', date],
    ['Where', listing.location_text],
    ['Contact', listing.contact],
    ['Image description', listing.image_alt],
    ['Submitted', new Date(listing.created_at).toLocaleString()],
  ]

  return (
    <article className={`${panel} grid gap-6 sm:grid-cols-[160px_1fr]`}>
      <a href={full} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size flyer for ${listing.title}`}>
        <img
          src={thumb}
          alt={listing.image_alt}
          width={320}
          height={427}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg border border-border"
        />
      </a>

      <div>
        <CategoryBadge category={listing.category} />
        <h2 className="mt-2 text-xl font-semibold">{listing.title}</h2>
        {listing.description && <p className="mt-2 whitespace-pre-line">{listing.description}</p>}

        <dl className="mt-4 space-y-2 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => onAct('approved')} className={buttonPrimary}>
            Approve
          </button>
          <button type="button" disabled={busy} onClick={() => onAct('rejected')} className={buttonSecondary}>
            Reject
          </button>
        </div>
      </div>
    </article>
  )
}

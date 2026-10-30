import { useState } from 'react'
import { SuccessAlert, ErrorState } from './states'
import { SHARE_SIZE, shareCardUrl } from '../lib/cloudinary'
import { buttonPrimary, buttonSecondary, sectionTitle } from '../lib/ui'
import type { Listing } from '../lib/types'

type Status = { kind: 'ok' | 'error'; message: string } | null

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'listing'

async function fetchJpeg(url: string, name: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Share image failed (${res.status})`)
  return new File([await res.blob()], `${name}.jpg`, { type: 'image/jpeg' })
}

export function ShareCard({ listing }: { listing: Listing }) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const [status, setStatus] = useState<Status>(null)

  const canNativeShare = typeof navigator.share === 'function'
  const previewUrl = shareCardUrl(listing)
  const exportUrl = shareCardUrl(listing, true)
  const pageUrl = `${window.location.origin}/listing/${listing.id}`
  const name = `${slug(listing.title)}-share-card`

  async function share() {
    setBusy('share')
    setStatus(null)
    try {
      if (!canNativeShare) {
        await navigator.clipboard.writeText(pageUrl)
        setStatus({ kind: 'ok', message: 'Link copied. Paste it anywhere to share.' })
        return
      }
      const data: ShareData = { title: listing.title, text: `${listing.title}\n${pageUrl}`, url: pageUrl }
      try {
        // Attach the card image where the device allows it; otherwise share just the link.
        const file = await fetchJpeg(exportUrl, name)
        if (navigator.canShare?.({ files: [file] })) data.files = [file]
      } catch {
        /* link-only share is fine */
      }
      await navigator.share(data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return // user closed the share sheet
      console.error('share failed:', e)
      setStatus({ kind: 'error', message: 'Could not share. You can copy the page address instead.' })
    } finally {
      setBusy(null)
    }
  }

  async function download() {
    setBusy('download')
    setStatus(null)
    try {
      const file = await fetchJpeg(exportUrl, name)
      const href = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = href
      a.download = file.name
      a.click()
      URL.revokeObjectURL(href)
      setStatus({ kind: 'ok', message: 'Image downloaded.' })
    } catch (e) {
      console.error('download failed:', e)
      // Last resort: open the image so it can be saved manually.
      window.open(exportUrl, '_blank', 'noopener')
      setStatus({ kind: 'error', message: 'Download did not start, so the image opened in a new tab instead.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="share-heading" className="mt-12 border-t border-border pt-10">
      <h2 id="share-heading" className={sectionTitle}>
        Share this listing
      </h2>

      <div className="mt-6 max-w-2xl">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface" style={{ aspectRatio: '1200 / 630' }}>
          {imageState === 'loading' && (
            <p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-muted">
              Building your share image…
            </p>
          )}
          <img
            src={previewUrl}
            alt={`Share card for ${listing.title}`}
            width={SHARE_SIZE.width}
            height={SHARE_SIZE.height}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageState('ready')}
            onError={() => setImageState('error')}
            className={`h-full w-full object-cover ${imageState === 'ready' ? '' : 'invisible'}`}
          />
        </div>

        {imageState === 'error' ? (
          <div className="mt-4 space-y-3">
            <ErrorState message="We could not build the share image. You can still share the link." />
            <button type="button" onClick={share} disabled={busy !== null} className={buttonPrimary}>
              {canNativeShare ? 'Share link' : 'Copy link'}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={share}
              disabled={busy !== null || imageState === 'loading'}
              aria-busy={busy === 'share'}
              className={buttonPrimary}
            >
              {busy === 'share' ? 'Sharing…' : canNativeShare ? 'Share' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={busy !== null || imageState === 'loading'}
              aria-busy={busy === 'download'}
              className={buttonSecondary}
            >
              {busy === 'download' ? 'Preparing…' : 'Download image'}
            </button>
          </div>
        )}

        <div className="mt-4" aria-live="polite">
          {status?.kind === 'ok' && <SuccessAlert>{status.message}</SuccessAlert>}
          {status?.kind === 'error' && <ErrorState message={status.message} />}
        </div>
      </div>
    </section>
  )
}

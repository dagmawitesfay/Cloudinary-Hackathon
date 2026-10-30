import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalyzeResponse } from '../../shared/analyze'
import type { CloudinaryUploadResult } from '../cloudinary/UploadWidget'
import { submitListing } from '../lib/listings'
import { ListingForm } from './ListingForm'

vi.mock('../lib/listings', () => ({ submitListing: vi.fn() }))

const upload = { public_id: 'flyers/abc123', width: 800, height: 1066 } as CloudinaryUploadResult
const empty: AnalyzeResponse = { suggestions: {}, status: { ocr: 'error', caption: 'error' } }
const prefilled: AnalyzeResponse = {
  suggestions: { title: ' Free Health Fair ', eventDate: '2026-11-14T10:00', location: '1420 Maple Ave' },
  altText: 'A flyer for a health fair',
  ocrText: 'FREE HEALTH FAIR',
  status: { ocr: 'ok', caption: 'ok' },
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit listing' }))

beforeEach(() => vi.mocked(submitListing).mockClear())

describe('ListingForm', () => {
  it('blocks an empty submit, explains why, and focuses the first problem', () => {
    render(<ListingForm upload={upload} analysis={empty} onSubmitted={() => {}} />)
    submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix')
    const title = screen.getByLabelText(/^Title/)
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveFocus()
    expect(submitListing).not.toHaveBeenCalled()
  })

  it('pre-fills from the analysis and saves exactly what the user confirmed', async () => {
    vi.mocked(submitListing).mockResolvedValue()
    const onSubmitted = vi.fn()
    render(<ListingForm upload={upload} analysis={prefilled} onSubmitted={onSubmitted} />)

    expect(screen.getByLabelText(/^Date/)).toHaveValue('2026-11-14')
    expect(screen.getByLabelText(/^Start time/)).toHaveValue('10:00')
    type('Category *', 'health')
    submit()

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(submitListing).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Free Health Fair', // trimmed
        category: 'health',
        image_public_id: 'flyers/abc123',
        image_alt: 'A flyer for a health fair',
        location_text: '1420 Maple Ave',
        contact: null, // blank optional fields become null
        description: null,
        ocr_raw_text: 'FREE HEALTH FAIR',
        tags: [],
      }),
    )
    // The client never sends a status; the database forces "pending".
    expect(vi.mocked(submitListing).mock.calls[0][0]).not.toHaveProperty('status')
  })

  it('works fully by hand when the AI found nothing', async () => {
    vi.mocked(submitListing).mockResolvedValue()
    const onSubmitted = vi.fn()
    render(<ListingForm upload={upload} analysis={empty} onSubmitted={onSubmitted} />)
    type('Title *', 'Community Cleanup')
    type('Category *', 'community')
    type('Image description *', 'Flyer for a neighborhood cleanup')
    submit()
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(vi.mocked(submitListing).mock.calls[0][0]).toMatchObject({ event_date: null, ocr_raw_text: null })
  })

  it('shows an error and keeps the form when saving fails', async () => {
    // Observed with vitest 5: mockReset() or a persistent mockRejectedValue make this *handled*
    // rejection fail the test as "unhandled". The component's catch is verified by the asserts below.
    vi.mocked(submitListing).mockImplementationOnce(() => Promise.reject(new Error('We could not save your listing.')))
    const onSubmitted = vi.fn()
    render(<ListingForm upload={upload} analysis={prefilled} onSubmitted={onSubmitted} />)
    type('Category *', 'health')
    submit()
    expect(await screen.findByText('We could not save your listing.')).toBeInTheDocument()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Submit listing' })).toBeEnabled()
  })
})

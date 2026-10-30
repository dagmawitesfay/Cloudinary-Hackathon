import axe from 'axe-core'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AnalyzeResponse } from '../shared/analyze'
import type { CloudinaryUploadResult } from './cloudinary/UploadWidget'
import { FilterPills } from './components/FilterPills'
import { Layout } from './components/Layout'
import { ListingCard } from './components/ListingCard'
import { ListingForm } from './components/ListingForm'
import type { Listing } from './lib/types'

vi.mock('./lib/listings', () => ({ submitListing: vi.fn() }))

// Colour contrast is checked separately (jsdom can't compute it); see DESIGN.md notes.
async function violations(container: HTMLElement) {
  const { violations } = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
}

const listing: Listing = {
  id: '1',
  created_at: '',
  status: 'approved',
  title: 'Free Health Fair',
  description: null,
  category: 'health',
  event_date: null,
  location_text: null,
  contact: null,
  image_public_id: 'flyers/abc',
  image_width: 800,
  image_height: 1066,
  image_alt: 'A flyer for a health fair',
  ocr_raw_text: null,
  tags: [],
}

describe('accessibility (axe)', () => {
  it('layout has valid landmarks, a skip link, and named navigation', async () => {
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<h1>Page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(await violations(container)).toEqual([])
  })

  it('the listing form has labelled fields', async () => {
    const analysis: AnalyzeResponse = { suggestions: {}, status: { ocr: 'error', caption: 'error' } }
    const { container } = render(
      <ListingForm upload={{ public_id: 'flyers/a', width: 1, height: 1 } as CloudinaryUploadResult} analysis={analysis} onSubmitted={() => {}} />,
    )
    expect(await violations(container)).toEqual([])
  })

  it('filter pills and listing cards pass', async () => {
    const { container } = render(
      <MemoryRouter>
        <FilterPills label="Category" options={[{ value: '', label: 'All' }, { value: 'food', label: 'Food' }]} value="" onChange={() => {}} />
        <ul>
          <li>
            <ListingCard listing={listing} />
          </li>
        </ul>
      </MemoryRouter>,
    )
    expect(await violations(container)).toEqual([])
  })
})

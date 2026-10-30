import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('../hooks/useListings', () => ({
  useListings: () => ({ loading: false, data: [], error: undefined, retry: () => {} }),
}))

describe('HomePage hero', () => {
  it('is one real level-1 heading that reads as a single sentence', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    // The stacked lines and the accent-coloured full stop must not break up the text.
    expect(headings[0]).toHaveTextContent(/^Find what's happening near you\.$/)
  })

  it('has the eyebrow and the expanded description', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Boston · Community flyers/)).toBeInTheDocument()
    expect(screen.getByText(/the church food pantry/)).toBeInTheDocument()
  })
})

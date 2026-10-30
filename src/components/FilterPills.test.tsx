import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FilterPills } from './FilterPills'

const options = [
  { value: '', label: 'All' },
  { value: 'health', label: 'Health' },
]

describe('FilterPills', () => {
  it('marks only the active pill as pressed', () => {
    render(<FilterPills label="Category" options={options} value="health" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Health' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports the chosen value', () => {
    const onChange = vi.fn()
    render(<FilterPills label="Category" options={options} value="" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Health' }))
    expect(onChange).toHaveBeenCalledWith('health')
  })

  it('is a labelled group for screen readers', () => {
    render(<FilterPills label="Category" options={options} value="" onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Category' })).toBeInTheDocument()
  })
})

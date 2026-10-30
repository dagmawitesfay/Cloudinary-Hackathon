import { useEffect, useState } from 'react'
import { fetchApprovedListings, fetchListing, type BrowseFilters } from '../lib/listings'
import type { Listing } from '../lib/types'

interface Result<T> {
  key: string
  data?: T
  error?: string
}

type Query<T> = { loading: boolean; data?: T; error?: string; retry: () => void }

function toQuery<T>(result: Result<T>, key: string, retry: () => void): Query<T> {
  const loading = result.key !== key
  return { loading, data: loading ? undefined : result.data, error: loading ? undefined : result.error, retry }
}

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.')

export function useListings({ q, category, when }: BrowseFilters): Query<Listing[]> {
  const [result, setResult] = useState<Result<Listing[]>>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([q, category, when, attempt])

  useEffect(() => {
    let cancelled = false
    fetchApprovedListings({ q, category, when })
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e) => !cancelled && setResult({ key, error: message(e) }))
    return () => {
      cancelled = true
    }
  }, [q, category, when, key])

  return toQuery(result, key, () => setAttempt((n) => n + 1))
}

export function useListing(id: string | undefined): Query<Listing | null> {
  const [result, setResult] = useState<Result<Listing | null>>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([id, attempt])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchListing(id)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e) => !cancelled && setResult({ key, error: message(e) }))
    return () => {
      cancelled = true
    }
  }, [id, key])

  if (!id) return { loading: false, data: null, retry: () => {} }
  return toQuery(result, key, () => setAttempt((n) => n + 1))
}

import { useEffect, useState } from 'react'
import { fetchPendingListings } from '../lib/listings'
import type { Listing } from '../lib/types'

export function usePendingListings() {
  const [result, setResult] = useState<{ key: number; data?: Listing[]; error?: string }>({ key: -1 })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchPendingListings()
      .then((data) => !cancelled && setResult({ key: attempt, data }))
      .catch((e) => !cancelled && setResult({ key: attempt, error: e instanceof Error ? e.message : 'Something went wrong.' }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const loading = result.key !== attempt
  return {
    loading,
    data: loading ? undefined : result.data,
    error: loading ? undefined : result.error,
    retry: () => setAttempt((n) => n + 1),
  }
}

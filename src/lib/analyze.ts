import type { AnalyzeResponse } from '../../shared/analyze'

const FAILED: AnalyzeResponse = { suggestions: {}, status: { ocr: 'error', caption: 'error' } }

/** Calls /api/analyze. Never throws: on any failure, returns empty suggestions. */
export async function analyzeFlyer(publicId: string): Promise<AnalyzeResponse> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return FAILED
    const data = (await res.json()) as AnalyzeResponse
    return data.status ? data : FAILED
  } catch {
    return FAILED
  }
}

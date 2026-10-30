import { useCallback, useRef, useState } from 'react'
import { AdvancedImage } from '@cloudinary/react'
import type { AnalyzeResponse } from '../../shared/analyze'
import { UploadWidget, type CloudinaryUploadResult } from '../cloudinary/UploadWidget'
import { analyzeFlyer } from '../lib/analyze'
import { previewImage } from '../lib/cloudinary'
import { ErrorState, Spinner } from '../components/states'

type Analysis = { state: 'idle' } | { state: 'analyzing' } | { state: 'done'; result: AnalyzeResponse }

const FIELD_LABELS = {
  title: 'Title',
  eventDate: 'Date and time',
  location: 'Location',
  contact: 'Contact',
} as const

export function SubmitPage() {
  const [upload, setUpload] = useState<CloudinaryUploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis>({ state: 'idle' })
  const latestUpload = useRef<string | null>(null)

  const handleUpload = useCallback(async (result: CloudinaryUploadResult) => {
    setUpload(result)
    setUploadError(null)
    setAnalysis({ state: 'analyzing' })
    latestUpload.current = result.public_id
    const analyzed = await analyzeFlyer(result.public_id)
    // Ignore a slow result if the user has since uploaded a different photo.
    if (latestUpload.current === result.public_id) setAnalysis({ state: 'done', result: analyzed })
  }, [])

  const handleError = useCallback((err: Error) => setUploadError(err.message), [])

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Add a flyer</h1>
      <p className="mt-2 text-stone-600">
        Take or upload a photo of a paper flyer. We'll read it and fill in what we can.
      </p>

      <div className="mt-6">
        <UploadWidget
          buttonText={upload ? 'Use a different photo' : 'Upload a flyer photo'}
          onUploadSuccess={handleUpload}
          onUploadError={handleError}
        />
        <p className="mt-2 text-sm text-stone-500">JPG, PNG, WebP, or HEIC, up to 10 MB.</p>
      </div>

      {uploadError && (
        <div className="mt-4">
          <ErrorState message={`Upload failed: ${uploadError}`} />
        </div>
      )}

      {upload && (
        <div className="mt-8 grid gap-6 sm:grid-cols-[200px_1fr]">
          <AdvancedImage
            cldImg={previewImage(upload.public_id, 400)}
            alt="Your uploaded flyer"
            className="w-full rounded-lg border border-stone-200"
          />

          <div aria-live="polite">
            {analysis.state === 'analyzing' && <Spinner label="Reading your flyer…" />}
            {analysis.state === 'done' && <AnalysisResult result={analysis.result} />}
          </div>
        </div>
      )}
    </section>
  )
}

function AnalysisResult({ result }: { result: AnalyzeResponse }) {
  const found = (Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).filter(
    (k) => result.suggestions[k],
  )

  return (
    <div className="space-y-4">
      {result.status.ocr !== 'ok' && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">
          We couldn't read the flyer automatically. Please fill in the details.
        </p>
      )}

      {found.length > 0 && (
        <dl className="space-y-2">
          {found.map((k) => (
            <div key={k}>
              <dt className="text-sm font-medium text-stone-500">{FIELD_LABELS[k]}</dt>
              <dd>{result.suggestions[k]}</dd>
            </div>
          ))}
        </dl>
      )}

      <div>
        <h2 className="text-sm font-medium text-stone-500">Suggested image description</h2>
        <p>{result.altText ?? 'No suggestion. You will be asked to describe the image.'}</p>
      </div>

      {result.ocrText && (
        <details className="rounded-lg border border-stone-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">What we read</summary>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-stone-700">{result.ocrText}</pre>
        </details>
      )}
    </div>
  )
}
